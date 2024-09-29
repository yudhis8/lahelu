import React, {useState, useEffect, useRef} from 'react';
import {StyleSheet, AppState, AppStateStatus} from 'react-native';
import Helper from '../../../../helpers/helper';
import BoxAtomic from '../../../atomics/basic/Box.atomic';
import ImageAtomic from '../../../atomics/images/Image.atomic';
import {ENV} from '../../../../constants/Env.constant';
import Video, {OnProgressData, VideoRef} from 'react-native-video';
import TextNormalAtomic from '../../../atomics/text/TextNormal.atomic';
import TextCaptionAtomic from '../../../atomics/text/TextCaption.atomic';
import ColorToken from '../../../../constants/Color.constant';
import ButtonPrimaryMolecule from '../../button/ButtonPrimary.molecule';
import {useSelector} from 'react-redux';
import {RootStates} from '../../../../redux/store';
import {useAppDispatch} from '../../../../redux/hooks/Selector.hooks';
import {setModal} from '../../../../redux/actions/Auth.action';
import useDimensions from '../../../../redux/hooks/Dimension.hooks';

interface MemeMediaItemProps {
  url: string;
  isVisible: boolean;
  mediaType: number;
  width: number;
  height: number;
  sensitive: boolean;
}

const MemeMediaItem = (props: MemeMediaItemProps) => {
  const dispatch = useAppDispatch();
  const authSelector = useSelector((state: RootStates) => state.auth);
  const {height, width} = useDimensions();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [progress, setProgress] = useState<number>(0);
  const videoRef = useRef<VideoRef>(null);

  const flexibleWidth = Helper.isTablet(width) ? width * 0.7 : width;

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('App has gone to the background!');
      }
      setAppState(nextAppState);
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription.remove();
    };
  }, [appState]);

  const handleProgress = (data: OnProgressData) => {
    const {currentTime, playableDuration} = data;
    const progress = (currentTime / playableDuration) * 100;
    setProgress(progress);
  };

  return (
    <BoxAtomic
      mtop={6}
      mx={Helper.isTablet(width) ? 16 : 0}
      borderRadius={Helper.isTablet(width) ? 8 : 0}
      overflow="hidden">
      {props.sensitive && !authSelector.data ? (
        <BoxAtomic
          backgroundColor={ColorToken.BorderSecondary}
          width={flexibleWidth}
          height={flexibleWidth}
          justifyContent="center"
          alignItems="center">
          <TextNormalAtomic title="KONTEN SENSITIF" fontWeight="bold" color={ColorToken.BaseWhite} />
          <TextCaptionAtomic
            mtop={8}
            mbot={8}
            title="Post ini mengandung unsur sesnsitif atau dewasa"
            color={ColorToken.TextSecondary}
          />
          <TextCaptionAtomic mbot={8} title="klik untuk ubah peraturan" color={ColorToken.BrandSecondary} />
          <ButtonPrimaryMolecule text="Lihat" onPress={() => dispatch(setModal(true))} />
        </BoxAtomic>
      ) : props.mediaType == 0 ? (
        <ImageAtomic
          imageStyle={{...styles.image, height, width: flexibleWidth}}
          imageSource={{uri: ENV.CACHE_URL + props.url}}
        />
      ) : (
        <>
          <Video
            ref={videoRef}
            onProgress={handleProgress}
            source={{uri: ENV.CACHE_URL + props.url}}
            style={{width: flexibleWidth, height: height + 100}}
            paused={!props.isVisible}
            onError={e => {
              console.info('video error: ', e);
            }}
            onLoad={() => {
              console.info('video loaded');
            }}
            resizeMode="contain"
            repeat
          />

          <BoxAtomic height={2} backgroundColor={ColorToken.BrandSecondary} width={`${progress}%`} />
        </>
      )}
    </BoxAtomic>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    resizeMode: 'stretch',
  },
});

export default React.memo(MemeMediaItem, (prevProps, nextProps) => {
  return prevProps.isVisible === nextProps.isVisible && prevProps.url === nextProps.url;
});
