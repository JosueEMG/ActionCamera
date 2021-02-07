const socket = io('/')
const videoGrid = document.getElementById('videoGrid')
const myVideo = document.createElement('video')
myVideo.muted = true

var peer = new Peer()

const myPeer = new Peer(undefined, {
	path: '/peerjs',
	host: '/',
	port: 5000,
})

const peers = {}
let myVideoStream
navigator.mediaDevices
	.getUserMedia({
		video: true,
		audio: true,
	})
	.then((stream) => {
		myVideoStream = stream
		addVideoStream(myVideo, stream)

		socket.on('user-connected', (userId) => {
			connectToNewUser(userId, stream)
		})

		peer.on('call', (call) => {
			call.answer(stream)
			const video = document.createElement('video')
			call.on('stream', (userVideoStream) => {
				addVideoStream(video, userVideoStream)
			})
		})

		let text = $('input')

		$('html').keydown(function (e) {
			if (e.which == 13 && text.val().length !== 0) {
				socket.emit('message', text.val())
				text.val('')
			}
		})

		socket.on('createMessage', (message, userId) => {
			$('ul').append(`<li >
								<span class="messageHeader">
									<span>
										De
										<span class="messageSender">${userId}</span> 
										para 
										<span class="messageReceiver">Todos:</span>
									</span>

									${new Date().toLocaleString('en-US', {
										hour: 'numeric',
										minute: 'numeric',
										hour12: true,
									})}
								</span>

								<span class="message">${message}</span>
							
							</li>`)
			scrollToBottom()
		})
	})

socket.on('user-disconnected', (userId) => {
	if (peers[userId]) peers[userId].close()
	errorDeleteMessage(userId)
})

$('#end').on('click', () => {
	Swal.fire({
		title: '¿Estas seguro de salir de la reunión?',
		text: "Tendrás que volver con el mismo link de invitación",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Quiero salir'
	  }).then((result) => {
		if (result.isConfirmed) {
			location.href ="end.html";
		}
	  })
})

peer.on('open', (id) => {
	socket.emit('join-room', ROOM_ID, id)
})

const connectToNewUser = (userId, stream) => {
	const call = peer.call(userId, stream)
	const video = document.createElement('video')
	call.on('stream', (userVideoStream) => {
		addVideoStream(video, userVideoStream)
	})
	call.on('close', () => {
		video.remove()
	})

	peers[userId] = call
	successDeleteMessage(userId)
}

const addVideoStream = (video, stream) => {
	video.srcObject = stream
	video.addEventListener('loadedmetadata', () => {
		video.play()
	})
	videoGrid.append(video)
}

const scrollToBottom = () => {
	var d = $('.mainChatWindow')
	d.scrollTop(d.prop('scrollHeight'))
}

const muteUnmute = () => {
	const enabled = myVideoStream.getAudioTracks()[0].enabled
	if (enabled) {
		myVideoStream.getAudioTracks()[0].enabled = false
		setUnmuteButton()
	} else {
		setMuteButton()
		myVideoStream.getAudioTracks()[0].enabled = true
	}
}

const setMuteButton = () => {
	const html = `
	  <i class="fas fa-microphone"></i>
	  <span>Mutear</span>
	`
	document.querySelector('.mainMuteButton').innerHTML = html
}

const setUnmuteButton = () => {
	const html = `
	  <i class="unmute fas fa-microphone-slash"></i>
	  <span>Desmutear</span>
	`
	document.querySelector('.mainMuteButton').innerHTML = html
}

const playStop = () => {
	console.log('object')
	let enabled = myVideoStream.getVideoTracks()[0].enabled
	if (enabled) {
		myVideoStream.getVideoTracks()[0].enabled = false
		setPlayVideo()
	} else {
		setStopVideo()
		myVideoStream.getVideoTracks()[0].enabled = true
	}
}

const setStopVideo = () => {
	const html = `
	  <i class="fas fa-video"></i>
	  <span>Parar Video</span>
	`
	document.querySelector('.mainVideoButton').innerHTML = html
}

const setPlayVideo = () => {
	const html = `
	<i class="stop fas fa-video-slash"></i>
	  <span>Reproducir Video</span>
	`
	document.querySelector('.mainVideoButton').innerHTML = html
}

const Toast = Swal.mixin({
	toast: true,
	position: 'top-end',
	showConfirmButton: false,
	timer: 6000
});

const errorDeleteMessage = name => {
	Toast.fire({
		icon: 'error',
		title: `La persona con codigo: ${name} salió la sala`
	})
}

const successDeleteMessage = name => {
	Toast.fire({
		icon: 'success',
		title: `La persona con codigo: ${name} entró la sala`
	})
}
