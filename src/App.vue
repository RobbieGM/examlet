<template>
  <div id="app">
    <header :class='{ active: headerVisible }' v-cloak>
      <div>
        <span id='menu' class='material-icons' @click='$refs.appDrawer.show()'>menu</span><span id='logo'>examlet</span>
      </div>
    </header>
    <div id='modal-overlay' :class='{active: modalOverlayActive}' @touchstart='modalOverlayClicked' @mousedown='modalOverlayClicked'></div>
    <div id='modal-dialog' :class='{active: modalDialog.visible}' v-cloak>
      <div id='md-content' v-html='modalDialog.content'></div>
      <div id='md-buttons'>
        <button v-for='(buttonText, index) in modalDialog.buttons' @click='dismissDialog(buttonText)' :class='{flat: index != modalDialog.buttons.length - 1}' :key='buttonText'>{{ buttonText }}</button>
      </div>
    </div>
    <sheet :side='"left"' ref='appDrawer' v-cloak>
      <div id='profile-container'>
				<img :src='user.profilePicture' v-if='user.profilePicture' alt='My profile picture'/>
        <img src='./assets/unknown-person.png' v-else alt='My profile picture'/>
        <div class='username'>{{ user.name || 'Not logged in' }}</div>
        <div v-if='user.domain' class='user-domain'>{{ user.domain }}</div>
      </div>
      <div id='option-container'>
        <div v-for='[icon, text, callback] in appDrawerOptions' @click='callback.bind(this)()' :key='text'>
          <span class='material-icons'>{{ icon }}</span>{{ text }}
        </div>
      </div>
    </sheet>
    <main v-cloak>
      <transition name='fade'>
        <span v-if='isLoggedIn == "indeterminate"' key='indeterminate' class='loader full'></span>
        <div v-if='isLoggedIn == "yes"' key='logged-in' id='is-logged-in'>
          <component :is='isLoggedIn == "yes" && accountTypeSpecificAppLoaded ? (user.accountType == "student" ? "student-app" : "teacher-app") : "null-component"' :user='user'></component>
        </div>
        <div v-if='isLoggedIn == "no"' key='logged-out'>
          <LandingPage></LandingPage>
        </div>
      </transition>
    </main>
    <div id='toast' :class='{active: toast.active}'>
      {{toast.content}}
      <button @click='dismissToast' class='flat accent2'>{{toast.buttonText}}</button>
    </div>
  </div>
</template>

<style lang='scss'>
@import './css/main';
</style>

<script>
import LandingPage from './components/LandingPage.vue';
import {historyManager} from './client-lib/history.js';
import {percentage, sendEmail, events} from './client-lib/global.js';
import {signUp} from './client-lib/gapi.js';

/* global auth2 */

export default {
	props: ['isLoggedIn', 'user', 'accountTypeSpecificAppLoaded'],
  data: () => ({
		toast: {
			active: false,
			content: '',
			buttonText: 'OK'
		},
		headerVisible: true,
		modalOverlayActive: false,
		modalDialog: {
			content: '',
			buttons: [],
			visible: false,
			onDismiss: () => {}
		},
		appDrawerOptions: [
			['people', 'Switch account', function() {
				this.modalOverlayClicked();
				this.signUp(undefined);
			}],
			['power_settings_new', 'Sign out', function() {
				this.modalOverlayClicked();
				auth2.signOut();
				localStorage.cookie = 'invalid';
			}]
		]
	}),
	methods: {
		showDialog(content, buttons=['OK']) {
			historyManager.pushState('modal-dialog');
			this.modalDialog.content = content;
			this.modalDialog.buttons = buttons;
			this.modalDialog.visible = true;
			this.showModalOverlay();
			return new Promise(res => {
				this.modalDialog.onDismiss = buttonText => res(buttonText);
			});
		},
		dismissDialog: historyManager.backButtonCallable('modal-dialog', function(result) {
			this.modalDialog.visible = false;
			this.hideModalOverlay();
			this.modalDialog.onDismiss(result);
		}),
		showModalOverlay() { this.modalOverlayActive = true },
		hideModalOverlay() { this.modalOverlayActive = false },
		modalOverlayClicked() {
			events.emit('modalOverlayClicked');
			let sheets = ['appDrawer', 'teacherSheet'];
			for (let ref of sheets) {
				if (this.$refs[ref] && this.$refs[ref].open)
					this.$refs[ref].hide();
			}
		},
		dismissToast() {

		},
		percentage,
		signUp,
		sendEmail
	},
	components: {LandingPage},
	mounted() {
		events.on('showModalOverlay', this.showModalOverlay);
		events.on('hideModalOverlay', this.hideModalOverlay);
		events.on('showHeader', () => this.headerVisible = true);
		events.on('hideHeader', () => this.headerVisible = false);
		events.on('updateUserTeachers', teachers => this.user.teachers = teachers);
	}
};
</script>
