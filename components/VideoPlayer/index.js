const videojs = require('video.js').default;
import '@videojs/http-streaming';
import 'videojs-errors';

import io from 'socket.io-client';

import {useEffect} from 'react';

import log from '../../utils/log';

import { useDispatch } from 'react-redux';

import { fetchChannel } from '../../actions';

const OFFLINE_POSTER = '/img/offline-poster.png';
const VIEWER_API_URL = process.env.VIEWER_API_URL;
function VideoPlayer(props) {
	let player;
	let videoNode;
	const dispatch = useDispatch();
	useEffect(() => {
		const canAutoplay = require('can-autoplay').default;
		const videoJsOptions = {
			errorDisplay: false,
			liveui: false,
			poster: !props.live ? OFFLINE_POSTER : '',
			plugins: {
				chromecast: {
					appId: '50E3A992',
					addButtonToControlBar: false, // Defaults to true
				},
				persistvolume: {
					namespace: 'guac-live'
				}
			},
			techOrder: ['chromecast', 'flvjs', 'html5'],
			flvjs: {
				mediaDataSource: {
					isLive: true,
					cors: true,
					withCredentials: false
				},
				enableStashBuffer: false,
				stashInitialSize: 1024 * 64, // 64KB
				enableWorker: true,
				lazyLoad: false,
				autoCleanupSourceBuffer: true,
				autoCleanupMaxBackwardDuration: 2,
				autoCleanupMinBackwardDuration: 1,
				seekType: 'range'
			  },
			  controlBar: {
				children: {
					  'playToggle': {},
					  'muteToggle': {},
					  'volumeControl': {},
					  'currentTimeDisplay': {},
					  'timeDivider': {},
					  'durationDisplay': {},
					  'liveDisplay': {},

					  'flexibleWidthSpacer': {},
					  'progressControl': {},
					  'pictureInPictureToggle': {},

					  'chromecastButton': {},
					  'QualitySelector': {},

					  'TheaterModeToggle': {
						  elementToToggle: 'guac',
						  className: 'theater-mode'
					  },
					  'fullscreenToggle': {}
				}
			},
			...props
		};
		
		if(window && typeof window.MediaSource === 'undefined'){
			videoJsOptions.html5 = {
				hls: {
					overrideNative: !videojs.browser.IS_SAFARI,
					allowSeeksWithinUnsafeLiveWindow: true,
					enableLowInitialPlaylist: true,
					handlePartialData: true,	  
				},
				nativeVideoTracks: true,
				nativeAudioTracks: true,
				nativeTextTracks: true
			};
		}

		if(window){
			window.flvjs = require('flv.js').default;
			window.videojs = videojs;
		}

		let viewerAPISocket, didCancel = false;

		let connectToViewerAPI = () => {
			viewerAPISocket = io(VIEWER_API_URL, {
				transports: ['websocket']
			});
			viewerAPISocket.on('connect', () => {
				log('info', 'ViewerAPI', `connected to ${channel}`);
				viewerAPISocket.emit('channel', channel);
			});
			viewerAPISocket.on('reload', () => {
				window.location.reload();
			});
			viewerAPISocket.on('redirect', (url) => {
				window.location = url;
			});
			viewerAPISocket.on('live', (liveBoolean) => {
				log('info', 'ViewerAPI', `socket sent live: ${liveBoolean}`);
				props.live = liveBoolean;
				dispatch(fetchChannel(props.streamInfo.username));
			});
			viewerAPISocket.on('reconnect', () => {
				log('info', 'ViewerAPI', 'reconnect');
			});
		};

		require('videojs-theater-mode/dist/videojs.theaterMode.js');
		require('../../videojs-flvjs.js');
		require('../../videojs-persistvolume.js');
		require('@silvermine/videojs-chromecast')(videojs, {
			reloadWebComponents: true
		});
		require('@silvermine/videojs-quality-selector')(videojs, {
			reloadWebComponents: true
		});
		require('videojs-hotkeys');
		// instantiate Video.js
		player = videojs(videoNode, videoJsOptions, function onPlayerReady() {
			log('info', null, 'onPlayerReady', this);
		});
		
        canAutoplay.video().then((obj) => {
            if(obj.result === false){
                player.muted(true);
            }
		});

		// Hide theater mode if not on channel page
		if(!props.streamInfo || !props.streamInfo.isChannel){
			player.controlBar.removeChild('TheaterModeToggle');
		}

		// Reload if the source fails (HLS-only)
		if(player.reloadSourceOnError){
			player.reloadSourceOnError({
				errorInterval: 10
			});
		}

		// Hotkeys
		if(player.hotkeys){
			player.hotkeys({
				volumeStep: 0.1,
				rewindKey: () => {
					return null;
				},
				forwardKey: () => {
					return null;
				},
				enableModifiersForNumbers: false,
				enableNumbers: false,
				enableHoverScroll: true
			});
		}

		player.on('pause', () => {
			if(viewerAPISocket) {
				if(viewerAPISocket.connected) {
					viewerAPISocket.disconnect();
				}
			}
		})
		player.on('playing', () => {
			if(viewerAPISocket == undefined){
				connectToViewerAPI();
			}else if(!viewerAPISocket.connected){
				connectToViewerAPI();
			}
		});

		player.on('error', (e) => {
			if(viewerAPISocket){
				if(viewerAPISocket.connected){
					viewerAPISocket.disconnect();
				}
			}
			if(e.code != 3){
				player.error(null);
				if(props.live){
					//retry();
				}
			}
		});

		player.on('theaterMode', function (elm, data){
			if(data.theaterModeIsOn){
				player.fill(true);
			}else{
				player.fill(false);
			}
		});

		// Specify how to clean up after this effect:
		return function cleanup() {
			didCancel = true;
			if(player){
				player.dispose();
			}
			if(viewerAPISocket){
				viewerAPISocket.removeAllListeners();
				viewerAPISocket.disconnect();
			}
		};
	  }, []);
	


	// wrap the player in a div with a `data-vjs-player` attribute
	// so videojs won't create additional wrapper in the DOM
	// see https://github.com/videojs/video.js/pull/3856
	return (
		<>	
			<div className="player" data-vjs-player>
				<video ref={ node => videoNode = node } className={`player-video video-js vjs-default-skin vjs-big-play-centered ${props.fill ? 'vjs-fill' : 'vjs-16-9'}`} poster={!props.live ? "/img/offline-poster.png" : ""} controls playsInline preload="auto"></video>
			</div>
		</>
	);
}

export default VideoPlayer;