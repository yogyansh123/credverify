import { useState, useEffect, useRef } from 'react';

/**
 * Hook to smoothly animate a numeric score transition in 300-500ms (default 400ms).
 * Makes score transitions (e.g. 45% -> 82%) feel quick and almost instant yet smooth.
 */
export function useAnimatedScore(targetScore, duration = 400) {
  const numTarget = typeof targetScore === 'number' ? targetScore : parseInt(targetScore, 10) || 0;
  const [displayScore, setDisplayScore] = useState(numTarget);
  const prevScoreRef = useRef(numTarget);

  useEffect(() => {
    const startScore = prevScoreRef.current;
    const endScore = numTarget;

    if (startScore === endScore) {
      setDisplayScore(endScore);
      return;
    }

    const startTime = performance.now();
    let animFrame;

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Fast, smooth cubic ease-out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startScore + (endScore - startScore) * easeOut);
      setDisplayScore(current);

      if (progress < 1) {
        animFrame = requestAnimationFrame(update);
      } else {
        prevScoreRef.current = endScore;
      }
    };

    animFrame = requestAnimationFrame(update);
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [numTarget, duration]);

  return displayScore;
}
