/* global io */

export const socket = io(location.protocol + '//' + location.hostname + ':' + 8000);
export const $ = document.getElementById.bind(document);
export function sleep(ms) {
	return new Promise(res => setTimeout(res, ms));
}
export function sendEmail(email) {
	location.href = 'mailto:' + email;
}
export const percentage = n => Math.round(n * 100);
export function getParentUntilMatches(elt, selector) {
	let p = elt;
	while (p && !p.matches(selector)) {
		p = p.parentNode;
	}
	return p || null;
}
export const events = {
	listeners: [],
	on(type, listener) {
		this.listeners.push({type, listener});
	},
	off(type, listener) {
		this.listeners = this.listeners.filter(l => !(type == l.type && listener == l.listener));
	},
	emit(type, ...args) {
		this.listeners.filter(l => l.type == type).forEach(l => l.listener(...args));
	}
};
export function preventScroll() {
	let scrollbarWidth = $('app').offsetWidth - $('app').clientWidth;
	$('app').style.overflowY = 'hidden';
	$('app').style.paddingRight = scrollbarWidth + 'px';
}
export function enableScroll() {
	$('app').style.overflowY = 'auto';
	$('app').style.paddingRight = '0px';
}