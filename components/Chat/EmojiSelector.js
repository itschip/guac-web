import React, { useState, useRef } from 'react';

import { NimblePicker } from 'emoji-mart';
import twitterData from 'emoji-mart/data/twitter.json';

import { useClickAway } from 'react-use';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function EmojiSelector(props){
	const [isOpen, setIsOpen] = useState(false);
	const [emotes, setEmotes] = useState(props.emotes);

	const ref = useRef(null);
	useClickAway(ref, () => {
	  setIsOpen(false);
	});
  

	const handleToggleClick = () => {
		setIsOpen(!isOpen);
	};

	return (
		<div ref={ref} className="chat-input__buttons__emote inline-flex items-center justify-center mr2">
			<FontAwesomeIcon icon={['far', 'smile-wink']} onClick={handleToggleClick} />
			<span className="absolute right-0 fr bottom-2 pv2">
				{isOpen &&
					<NimblePicker
						perLine={8}
						emojiSize={24}
						sheetSize={20}
						set="twitter"
						custom={emotes}
						onSelect={props.onSelect}
						theme={props.darkMode ? 'dark' : 'light'}
						data={twitterData}
						include={[
							'recent',
							'custom-Global',
							'custom-Twitch',
							'custom-BetterTTV',
							'custom-FrankerfaceZ',
							'people',
							'nature',
							'foods',
							'activity',
							'places',
							'objects',
							'symbols',
							'flags',
						]}
						showPreview={true}
					/>
				}
			</span>
		</div>
	);
}

  
export default EmojiSelector;