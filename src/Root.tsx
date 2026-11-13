import {Composition} from 'remotion';
import {HelloWorld} from './HelloWorld';
import {Arena} from './Arena';

export const Root: React.FC = () => {
  return (
    <>
    <Composition
      id="Arena"
      component={Arena}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{title: 'LA ARENA', episode: 'EPISODIO 1', eliminated: 'Hugo'}}
    />
    <Composition
      id="HelloWorld"
      component={HelloWorld}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{title: 'Hola Remotion'}}
    />
    </>
  );
};
