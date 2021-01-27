// Defines the custom CSS for the difficulty slider component
import { withStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/core/Slider';
import ValueLabel from '@material-ui/core/Slider/ValueLabel';

// Custom styles configuration for the Difficulty Slider component
export const DiffSlider = withStyles({
	root: {
		color: '#34c74f',
		height: 8
	},
	thumb: {
		height: 20,
		width: 20,
		backgroundColor: '#ddd',
		border: '0px solid currentColor',
		marginTop: -7,
		marginLeft: -10,
		'&:focus, &:hover, &$active': {
			boxShadow: 'inherit'
		}
	},
	active: {},
	valueLabel: {
		left: 'calc(-50% + 4px)'
	},
	track: {
		height: 6,
		borderRadius: 4
	},
	markLabel: {
		fontSize: '0.7em'
	}
})(Slider);

// Custom styles for the Difficulty ValueLabel component
export const DiffValueLabel = withStyles({
	thumb: {
		'&$open': {
			'& $offset': {
				transform: 'scale(.9) translateY(-5px)'
			}
		}
	},
	open: {},
	offset: {
		zIndex: 1,
		lineHeight: 1.2,
		top: -46,
		left: -10,
		transformOrigin: 'bottom center',
		transform: 'scale(0)',
		position: 'absolute'
	},
	circle: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: 40,
		height: 40,
		borderRadius: '50% 50% 50% 0',
		backgroundColor: 'currentColor',
		transform: 'rotate(-45deg)'
	},
	label: {
		transform: 'rotate(45deg)'
	}
})(ValueLabel);
