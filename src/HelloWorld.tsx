import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const HelloWorld: React.FC<{title: string}> = ({title}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const scale = spring({frame, fps, config: {damping: 12}});
  const opacity = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0b1020, #3b2a7a)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      <h1
        style={{
          color: 'white',
          fontFamily: 'sans-serif',
          fontSize: 140,
          transform: `scale(${scale})`,
        }}
      >
        {title}
      </h1>
    </AbsoluteFill>
  );
};
