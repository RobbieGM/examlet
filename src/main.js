import Vue from 'vue';
import App from './App.vue';
import Sheet from './components/SheetComponent.vue';
import LandingPage from './components/LandingPage.vue';
import {authenticate} from './client-lib/gapi.js';
import SocketMixin from './client-lib/socket-mixin.js';
import {HistoryMixin} from './client-lib/history.js';

/* global iNoBounce */

Vue.config.productionTip = false;
Vue.mixin(SocketMixin);
Vue.mixin(HistoryMixin);
Vue.component('sheet', Sheet);
Vue.component('landing-page', LandingPage);
Vue.component('null-component', {
	template: '<span style="display: none"></span>' // vue doesn't let it be empty
});

var root = new Vue({
  data: {
    isLoggedIn: 'indeterminate',
    user: {}
  },
  render: function(h) {
	return h(App, {
		props: {
			isLoggedIn: this.isLoggedIn,
			user: this.user,
			accountTypeSpecificAppLoaded: this.accountTypeSpecificAppLoaded
		},
		ref: 'app'
	});
  }
});
root.$mount('#app');

authenticate(async (data, googleUserNeedsRevalidation) => {
	root.user = data.user;
	root.isLoggedIn = 'yes';
	if (googleUserNeedsRevalidation) {
		location.reload();
	}
	if (data.user.accountType == 'student') {
		let StudentApp = (await import('./components/StudentApp.vue')).default;
		Vue.component('student-app', StudentApp);
	} else {
		let TeacherApp = (await import('./components/TeacherApp.vue')).default;
		Vue.component('teacher-app', TeacherApp);
	}
	root.accountTypeSpecificAppLoaded = true;
	root.$forceUpdate();
	/*if (wasLoggedIn != 'yes') {
		events.on('accountTypeSpecificAppMounted', () => {

		});
	}*/
}, reason => {
	let wasLoggedIn = root.isLoggedIn;
	if (reason == 'rejection' && wasLoggedIn == 'yes') { // mostly likely tried switching to un-set-up account
    root.showDialog(`We couldn't verify you using Google. If this is because you clicked "switch account" and switched to an account that hasn't been created yet, please sign out and sign back in with that new account using one of the buttons on the landing page. We need to know if you are a student or a teacher.`);
	}
	if (wasLoggedIn == 'indeterminate') { // if yes, don't log out, if already no, no need
		root.isLoggedIn = 'no';
	}
});

function addActiveClass(evt) {
	evt.target.classList.add('held-down');
}
function removeActiveClass(evt) {
	evt.target.classList.remove('held-down');
}

document.body.addEventListener('touchstart', addActiveClass);
document.body.addEventListener('touchend', removeActiveClass);
document.body.addEventListener('touchcancel', removeActiveClass);

if (/iPhone|iPad/i.test(navigator.userAgent)) {
	iNoBounce.enable();
	root.$el.style.position = 'fixed';
	setTimeout(() => root.$el.style.position = 'absolute', 300);
}