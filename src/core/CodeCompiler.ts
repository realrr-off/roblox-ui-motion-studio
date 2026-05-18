import type { TweenState, TargetProperty } from '../state/store';
import { optimizeMergedTweens, extractSegments } from './TweenMergeOptimizer';
import { groupKeyframesByLane } from './PropertyLanes';

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const formatValue = (prop: string, value: unknown) => {
  if (prop === 'Position' || prop === 'Size') {
    const v = value as Record<string, number>;
    return `UDim2.new(${v.x !== undefined ? v.x : v.width}, 0, ${v.y !== undefined ? v.y : v.height}, 0)`;
  }
  if (prop === 'Rotation' || prop === 'Transparency' || prop === 'TextTransparency' || prop === 'TextSize') {
    return String(value);
  }
  if (prop === 'BackgroundColor3' || prop === 'BorderColor3') {
    const rgb = hexToRgb(value as string);
    return `Color3.fromRGB(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }
  if (prop === 'AnchorPoint') {
    const v = value as { x: number; y: number };
    return `Vector2.new(${v.x}, ${v.y})`;
  }
  return String(value);
};

const formatGoalsTable = (goals: Partial<Record<TargetProperty, unknown>>): string => {
  const entries = Object.entries(goals).map(([prop, val]) => `${prop} = ${formatValue(prop, val)}`);
  return `{ ${entries.join(', ')} }`;
};

export class CodeCompiler {
  public static compile(state: TweenState): string {
    const { objects, exportFormat, laneSettings } = state;

    let output = `-- Production Multi-Object Sequence Generator\nlocal TweenService = game:GetService("TweenService")\n\n`;

    output += `-- 1. Object References (Replace with your actual paths)\n`;
    Object.values(objects).forEach((obj) => {
      output += `local ${obj.id} = script.Parent:WaitForChild("${obj.name}")\n`;
    });
    output += `\n`;

    const generateMergedBody = () => {
      let body = '';
      const merged = optimizeMergedTweens(state);
      const byTarget: Record<string, typeof merged> = {};

      merged.forEach((call) => {
        if (!byTarget[call.targetId]) byTarget[call.targetId] = [];
        byTarget[call.targetId].push(call);
      });

      Object.keys(byTarget).forEach((targetId) => {
        const calls = byTarget[targetId].sort((a, b) => a.startTime - b.startTime);
        body += `    -- Sequence for ${objects[targetId].name} (merge-optimized: ${calls.length} TweenService calls)\n`;
        body += `    task.spawn(function()\n`;

        let lastTime = 0;
        calls.forEach((call, index) => {
          const waitDuration = Math.max(0, call.startTime - lastTime);
          if (waitDuration > 0.001) {
            body += `        task.wait(${waitDuration.toFixed(3)})\n`;
          }

          let easingStr = `Enum.EasingStyle.${call.easingStyle}`;
          if (call.easingStyle === 'CustomBezier') {
            easingStr = `Enum.EasingStyle.Cubic`;
            body += `        -- CustomBezier mapped to Cubic\n`;
          }

          const propsLabel = call.mergedProperties.join(' + ');
          body += `        -- Merged tween: ${propsLabel}\n`;
          body += `        local ti_${index} = TweenInfo.new(${call.duration.toFixed(3)}, ${easingStr}, Enum.EasingDirection.${call.easingDirection})\n`;
          body += `        local tween_${index} = TweenService:Create(${targetId}, ti_${index}, ${formatGoalsTable(call.goals)})\n`;
          body += `        tween_${index}:Play()\n`;
          body += `        tween_${index}.Completed:Wait()\n\n`;

          lastTime = call.startTime + call.duration;
        });

        body += `    end)\n\n`;
      });

      return body;
    };

    const generateLaneBody = () => {
      let body = '';
      const grouped = groupKeyframesByLane(state.keyframes);

      Object.keys(grouped).forEach((targetId) => {
        const props = Object.keys(grouped[targetId]);
        if (props.length === 0) return;

        body += `    -- Sequence for ${objects[targetId].name}\n`;

        props.forEach((prop) => {
          const kfs = grouped[targetId][prop as TargetProperty];
          if (kfs.length === 0) return;

          body += `    task.spawn(function() -- Property lane: ${prop}\n`;
          let lastTime = 0;

          kfs.forEach((kf, index) => {
            let duration = kf.time - lastTime;
            if (duration < 0.01) duration = 0.01;

            let easingStr = `Enum.EasingStyle.${kf.easingStyle}`;
            if (kf.easingStyle === 'CustomBezier') {
              easingStr = `Enum.EasingStyle.Cubic`;
              body += `        -- CustomBezier: [${kf.customBezier?.join(', ')}] mapped to Cubic\n`;
            }

            body += `        local ti_${index} = TweenInfo.new(${duration.toFixed(2)}, ${easingStr}, Enum.EasingDirection.${kf.easingDirection})\n`;
            body += `        local tween_${index} = TweenService:Create(${targetId}, ti_${index}, {${prop} = ${formatValue(prop, kf.value)}})\n`;
            body += `        tween_${index}:Play()\n`;
            body += `        tween_${index}.Completed:Wait()\n\n`;

            lastTime = kf.time;
          });

          body += `    end)\n\n`;
        });
      });

      return body;
    };

    const generateSequenceBody = () => {
      if (laneSettings.mergeOptimization) {
        const stats = extractSegments(state).length;
        const merged = optimizeMergedTweens(state).length;
        output += `-- Tween Merge Optimizer: ${stats} segments -> ${merged} combined TweenService calls\n`;
        return generateMergedBody();
      }
      output += `-- Per-property lanes (merge optimization disabled)\n`;
      return generateLaneBody();
    };

    if (exportFormat === 'ModuleScript') {
      output += `local TweenAnimation = {}\n\n`;
      output += `function TweenAnimation.Play()\n`;
      output += generateSequenceBody();
      output += `end\n\n`;
      output += `return TweenAnimation\n`;
    } else if (exportFormat === 'Function') {
      output += `local function playSequence()\n`;
      output += generateSequenceBody();
      output += `end\n\n`;
      output += `-- playSequence()\n`;
    } else {
      output += `-- 2. Play Sequence\n`;
      output += generateSequenceBody();
      output += `print("Sequence finished!")\n`;
    }

    return output;
  }
}
