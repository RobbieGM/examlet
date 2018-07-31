<template>
	<div @touchstart='touchStart' @touchend='touchEnd' @touchcancel='touchEnd' @touchmove='touchMove' @hide='hide' @show='show' :style="getStyle()" :class="['sheet', side, (open ? 'open' : '')]">
		<slot></slot>
	</div>
</template>


<script>
import {events} from '../client-lib/global.js';

const Sheet = {
	props: ['side', 'id'],
	data() {
		return {
			lastTouch2: null, // even before lastTouch
			lastTouch: null,
			firstTouch: null,
			translateX: 0,
			translateY: 0,
			open: false
		};
	},
	methods: {
		getTouchDirection(deltaX, deltaY) {
			let angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
			angle += 360; angle %= 360; // always positive
			if (angle >= 315 || angle < 45)
				return 'right';
			if (angle >= 45 && angle < 135)
				return 'down';
			if (angle >= 135 && angle < 225)
				return 'left';
			if (angle >= 225 && angle < 315)
				return 'up';
		},
		getStyle() {
			return {
				transform: (this.translateX || this.translateY) ? `translate(${this.translateX}px, ${this.translateY}px)` : ''
			};
		},
		touchStart(event) {
			this.lastTouch = event.touches[0];
			this.firstTouch = event.touches[0];
			this.$el.style.transitionDuration = '0s';
			this.$el.style.transitionTimingFunction = 'ease-out';
		},
		touchMove(event) {
			event.preventDefault(); // disable swipe-down reloading on android
			let t = event.touches[0];
			let deltaX = t.clientX - this.lastTouch.clientX;
			let deltaY = t.clientY - this.lastTouch.clientY;
			this.lastTouch2 = this.lastTouch;
			this.lastTouch = t;

			let touchDirection = this.getTouchDirection(deltaX, deltaY);
			if ((this.side == 'left' || this.side == 'right') && (touchDirection == 'left' || touchDirection == 'right'))
				this.translateX += deltaX;
			if ((this.side == 'top' || this.side == 'bottom') && (touchDirection == 'up' || touchDirection == 'down'))
				this.translateY += deltaY;

			if (this.side == 'left' && this.translateX > 0) this.translateX = 0;
			if (this.side == 'right' && this.translateX < 0) this.translateX = 0;
			if (this.side == 'top' && this.translateY > 0) this.translateY = 0;
			if (this.side == 'bottom' && this.translateY < 0) this.translateY = 0;
		},
		touchEnd(event) {
			if (event.touches.length !== 0) return; // possible second touch
			this.$el.style.removeProperty('transition-duration');
			let t = this.lastTouch;
			let dir = this.getTouchDirection(t.clientX - this.lastTouch2.clientX, t.clientY - this.lastTouch2.clientY);
			let dist = Math.sqrt((t.clientX - this.firstTouch.clientX) ** 2 + (t.clientY - this.firstTouch.clientY) ** 2);
			if (((dir == 'down' && this.side == 'bottom') ||
				(dir == 'up' && this.side == 'top') ||
				(dir == 'left' && this.side == 'left') ||
				(dir == 'right' && this.side == 'right')) && dist >= 40) {
				this.hide(true);
			} else {
				this.show();
			}
		},
		hide(useLinearEasing=false) {
			if (useLinearEasing) {
				this.$el.style.transitionTimingFunction = 'ease-out'; // will be undone in show()
				this.$el.style.transitionDuration = '0.15s';
			}
			this.open = false;
			this.resetPosition();
			events.emit('hideModalOverlay');
		},
		show() {
			this.$el.style.removeProperty('transition-timing-function'); // reset any linear easing from hide()
			this.$el.style.removeProperty('transition-duration');
			this.open = true;
			this.resetPosition();
			events.emit('showModalOverlay');
		},
		resetPosition() {
			this.translateX = 0;
			this.translateY = 0;
		}
	},
	mounted() {
		events.on('modalOverlayClicked', () => this.hide());
	}
};

export default Sheet;

</script>