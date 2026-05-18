import type { TweenState, TargetProperty } from '../state/store';
import { quantizeToFrame } from './RobloxEasing';
import { TimelineSimulator } from './TimelineSimulator';

export class PlaybackEngine {
  private elements: Record<string, HTMLElement> = {};
  private animationId: number | null = null;
  private lastTimestamp: number | null = null;
  private state: TweenState | null = null;
  private simulator = new TimelineSimulator();
  private onTimeUpdate?: (time: number) => void;

  public registerElement(id: string, el: HTMLElement | null) {
    if (el) {
      this.elements[id] = el;
    } else {
      delete this.elements[id];
    }
  }

  public setState(state: TweenState) {
    this.state = state;
    this.simulator.rebuild(state);
  }

  public setOnTimeUpdate(cb: (time: number) => void) {
    this.onTimeUpdate = cb;
  }

  public start() {
    if (this.animationId === null) {
      this.lastTimestamp = performance.now();
      this.animationId = requestAnimationFrame((ts) => this.loop(ts));
    }
  }

  public stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public evaluateAtTime(time: number) {
    if (!this.state) return;

    const fps = this.state.laneSettings.simulationFps;
    const evalTime = this.state.laneSettings.useFrameAccuratePlayback
      ? quantizeToFrame(time, fps)
      : time;

    const objects = this.simulator.evaluate(evalTime, this.state);

    objects.forEach((objState) => {
      const el = this.elements[objState.targetId];
      if (!el) return;

      (Object.keys(objState.properties) as TargetProperty[]).forEach((prop) => {
        const value = objState.properties[prop];
        if (value !== undefined) {
          this.applyDOMStyle(el, prop, value);
        }
      });
    });
  }

  private loop(timestamp: number) {
    if (!this.state || !this.state.timeline.isPlaying) {
      this.animationId = null;
      return;
    }

    const delta = (timestamp - (this.lastTimestamp || timestamp)) / 1000;
    this.lastTimestamp = timestamp;

    let newTime = this.state.timeline.currentTime + delta * this.state.timeline.playbackSpeed;

    if (newTime > this.state.timeline.duration) {
      if (this.state.timeline.isLooping) {
        newTime = newTime % this.state.timeline.duration;
      } else {
        newTime = this.state.timeline.duration;
        this.onTimeUpdate?.(newTime);
        this.evaluateAtTime(newTime);
        this.animationId = null;
        return;
      }
    }

    if (this.state.laneSettings.useFrameAccuratePlayback) {
      newTime = quantizeToFrame(newTime, this.state.laneSettings.simulationFps);
    }

    this.onTimeUpdate?.(newTime);
    this.evaluateAtTime(newTime);

    this.animationId = requestAnimationFrame((ts) => this.loop(ts));
  }

  private applyDOMStyle(el: HTMLElement, prop: string, value: unknown) {
    if (prop === 'Position') {
      const v = value as { x: number; y: number };
      el.style.left = `${v.x * 100}%`;
      el.style.top = `${v.y * 100}%`;
    } else if (prop === 'Size') {
      const v = value as { width: number; height: number };
      el.style.width = `${v.width * 100}%`;
      el.style.height = `${v.height * 100}%`;
    } else if (prop === 'Rotation' || prop === 'AnchorPoint') {
      if (prop === 'Rotation') el.dataset.rot = String(value);
      if (prop === 'AnchorPoint') {
        const v = value as { x: number; y: number };
        el.dataset.ax = v.x.toString();
        el.dataset.ay = v.y.toString();
      }
      const rot = el.dataset.rot || '0';
      const ax = el.dataset.ax || '0.5';
      const ay = el.dataset.ay || '0.5';
      el.style.transform = `translate(-${parseFloat(ax) * 100}%, -${parseFloat(ay) * 100}%) rotate(${rot}deg)`;
    } else if (prop === 'BackgroundColor3') {
      el.style.backgroundColor = value as string;
    } else if (prop === 'BorderColor3') {
      el.style.borderColor = value as string;
    } else if (prop === 'Transparency') {
      el.style.opacity = `${1 - (value as number)}`;
    } else if (prop === 'TextTransparency') {
      const label = el.querySelector('.target-label') as HTMLElement;
      if (label) label.style.opacity = `${1 - (value as number)}`;
    } else if (prop === 'TextSize') {
      el.style.fontSize = `${value}px`;
    }
  }
}
