import { socket } from './global.js';
/* global gapi */

var googleUser, accountType, auth2; // accountType keeps last button click account type state for event handler
var googleUserNeedsRevalidation = false; // since google authentication usually happens after cookie authentication, this variable tells whether to reload the user or not

const SCHEMES = new Set(['cookie', 'google']);

function verifyGoogleAccount(alreadySuccessful) {
	googleUser = auth2.currentUser.get();
	if (!alreadySuccessful || googleUserNeedsRevalidation) {
		socket.emit('loginWithGoogle', {
			token: googleUser.getAuthResponse().id_token,
			accountType
		});
	}
}

const setsAreEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value));

export function authenticate(onUpdate, onFail, timeout=5000) {
	var rejectedSchemes = new Set([]);
	var successful = false;
	const loginTimeout = setTimeout(() => onFail('timeout'), timeout);
	gapi.load('auth2', () => {
		auth2 = gapi.auth2.init({
			client_id: '144041458139-l0epu9merdau8a862sdn6bf4cgik7duc.apps.googleusercontent.com',
			cookiepolicy: 'single_host_origin',
			prompt: 'select_account'
		});
		function onStateChange(isSignedIn) {
			if (isSignedIn) {
				verifyGoogleAccount(successful);
			} else {
				// don't unset user, the cookie can still keep us logged in
			}
		}
		function onUserChange(/*user*/) {
			verifyGoogleAccount(successful);
		}
		auth2.then(() => { // waits for response
			if (!auth2.isSignedIn.get()) {
				rejectedSchemes.add('google');
				checkForAllRejected();
			}
		});
		auth2.isSignedIn.listen(onStateChange);
		auth2.currentUser.listen(onUserChange);
	});
	socket.on('connect', () => {
		if (localStorage.cookie) {
			socket.emit('loginWithCookie', {
				cookie: localStorage.cookie
			});
		} else {
			rejectedSchemes.add('cookie');
			checkForAllRejected();
		}
	});
	socket.on('loginSuccessful', data => {
		successful = true;
		localStorage.cookie = data.user.cookie;
		clearTimeout(loginTimeout);
		console.log('loginSuccessful, onUpdate(); loginMethod', data.loginMethod);
		onUpdate(data, googleUserNeedsRevalidation);
		if (data.loginMethod == 'google')
			googleUserNeedsRevalidation = false;
	});
	const checkForAllRejected = () => {
		if (setsAreEqual(SCHEMES, rejectedSchemes)) { // tried all possible methods, send failure
			onFail('rejection');
		}		
	};
	socket.on('loginFailure', loginMethod => {
		rejectedSchemes.add(loginMethod);
		checkForAllRejected();
	});
}

export async function signUp(signUpAs) {
	accountType = signUpAs;
	googleUserNeedsRevalidation = true;
	googleUser = await auth2.signIn();
}