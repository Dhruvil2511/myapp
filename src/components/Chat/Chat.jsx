import React, { useEffect, useState } from 'react'
import axios from 'axios';
import SendIcon from '@mui/icons-material/Send';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { useParams } from 'react-router-dom';
import '../Chat/Chat.scss'
import VideoCallIcon from '@mui/icons-material/VideoCall';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

const firebaseConfig = {
    apiKey: "AIzaSyCSOJm6G6RZFH46AlN9oeQmjfuyIIGXrG0",
    authDomain: "signalling-28129.firebaseapp.com",
    databaseURL: "https://signalling-28129-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "signalling-28129",
    storageBucket: "signalling-28129.appspot.com",
    messagingSenderId: "985022221543",
    appId: "1:985022221543:web:d08428c9ffe1beee9c2642",
    measurementId: "G-YJPJ8LZZXD"
};

firebase.initializeApp(firebaseConfig);


let messageChannel;
let channel;
// let message = null;

const Chat = ({ peerAName, peerBName, peerApfpId, peerBpfpId, localConnection, remoteConnection }) => {
    let { id } = useParams();
    const [avatar, setAvatar] = useState(null);
    const [messageList, setMessageList] = useState([]);
    const [message, setMessage] = useState('');
    const [videoCallButtonState, setVideoCallButtonState] = useState(true);
    // const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const chatbox = document.querySelector(".chatBox");

    // let {id} = useParams();

    useEffect(() => {
        let checkPeerRole = sessionStorage.getItem('peerRole');
        if (checkPeerRole === 'peerA') {
            initializeLocalConnection();
        } else {
            initializeRemoteConnection();
        }

        fetchAvatar();
    }, []);

    async function initializeLocalConnection() {
        console.log(localConnection);
        messageChannel = localConnection.createDataChannel('messageChannel');
        messageChannel.addEventListener('open', () => {
            console.log('Message channel opened');
        });

        messageChannel.addEventListener('message', (event) => {
            if (event.data) {
                console.log(event.data);
                setMessageList(prevList => [...prevList, { id: Math.floor(Math.random() * 100), 'role': 'peerB', 'message': event.data }]);
            }
        });

        messageChannel.addEventListener('close', (event) => {
            console.log('Message channel closed');
        });
    }
    async function initializeRemoteConnection() {

        remoteConnection.addEventListener('datachannel', async (event) => {
            channel = event.channel;
            if (channel.label === 'messageChannel') {
                remoteConnection.messageChannel = channel;
                channel.onmessage = recieveMessage;
            }
            channel.onopen = event => console.log(channel.label + " opened");
            channel.onclose = event => console.log(channel.label + " closed");
        });
    }

    async function recieveMessage(e) {
        console.log('recieved message from peerA : ' + e.data);
        setMessageList(prevList => [...prevList, { id: Math.floor(Math.random() * 100), 'role': 'peerA', 'message': e.data }]);
    }
    const sendMessage = async (e) => {
        e.preventDefault();
        if (message === ' ' || message === '') return;

        document.getElementById('input-field').value = '';
        let val = sessionStorage.getItem('peerRole');
        if (val === 'peerA') {
            setMessageList(prevList => [...prevList, { id: Math.floor(Math.random() * 100), 'role': 'peerA', 'message': message }]);
            messageChannel.send(message);

        } else {
            setMessageList(prevList => [...prevList, { id: Math.floor(Math.random() * 100), 'role': 'peerB', 'message': message }]);
            remoteConnection.messageChannel.send(message);
        }
        setTimeout(() => {
            chatbox.scrollTop = chatbox.scrollHeight;
        }, 100);

        setMessage('');
    }

    const fetchAvatar = () => {
        let key = '';
        sessionStorage.getItem('peerRole') === 'peerA' ? key = peerBpfpId : key = peerApfpId
        axios.get(`https://api.multiavatar.com/${key}.png?apikey=GlfxOwCHERyz56`).then((response) => {
            setAvatar(response.config.url);

        }).catch((error) => {
            console.log(error)
        });
    }

    async function handleChange(event) {
        setMessage(event.target.value);
    }
    async function handlevideoCallButtonState(event) {
        const db = firebase.firestore();
        let userRef = db.collection('users').doc(`${id}`);

        userRef.onSnapshot(async (snapshot) => {
            var data = snapshot.data();
            console.log(data);
            if (data && data.videoCallHandle) {
                if (data.videoCallHandle && data.videoCallHandle.clickedBy === null) {
                    document.querySelector('.videoBtn').disabled = false;
                    setVideoCallButtonState(false);
                }
            }
        });

        if (videoCallButtonState) {
            document.querySelector('.videoBtn').disabled = true;
        }

        let val = sessionStorage.getItem('peerRole');
        val === 'peerA' ? await userRef.set({ videoCallHandle: { clickedBy: 'peerA', clicked: true } }) : await userRef.set({ videoCallHandle: { clickedBy: 'peerB', clicked: true } });

    }

    async function handleCopy(event) {
        event.preventDefault();
        let copied = await navigator.clipboard.readText();
        setMessage(copied);
        document.querySelector('#input-field').focus();
    }


    return (
        <>
            <div style={{ backgroundColor: 'transparent', overflow: 'hidden', border: '1px solid white', borderRadius: '15px', height: '80vh', width: '30%', float: 'left' }}>
                <div style={{ backgroundColor: '#1a1a1a', flexDirection: 'row', borderBottom: '1px solid white', height: '10%', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                    <div style={{ height: '100%', width: '75%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <img src={avatar} alt="avatar" style={{ height: '80%', marginRight: '5%' }} />
                        <span style={{ color: 'white', fontSize: '1.2vw', marginLeft: '1.5%', marginRight: '-1%' }}>
                            {sessionStorage.getItem('peerRole') === 'peerA' ? peerBName : peerAName}
                        </span>
                    </div>
                    <div className="video-button">
                        <button className='videoBtn' style={{ background: 'transparent', border: 'none' }} onClick={handlevideoCallButtonState}>
                            <VideoCallIcon style={{ transform: `scale(${2})`, width: '100%', color: 'rgb(26, 240, 161)' }} />
                        </button>
                    </div>
                </div>


                <div className="chatBox" style={{ height: '80%', overflow: 'scroll', overflowX: 'hidden', position: 'relative' }}>
                    {
                        messageList.map((value) => {
                            let checkPeerRole = sessionStorage.getItem('peerRole');
                            // console.log(value);
                            if (checkPeerRole === 'peerA') {
                                if (value.role === 'peerA') {
                                    return (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <div key={value.id} style={{ wordWrap: 'break-word', maxWidth: '70%', maxHeight: 'fit-content', backgroundColor: '#0A82FD', color: 'white', padding: '1.5%', margin: '1.2%', borderRadius: '15px' }}>
                                                {`${value.message}`}
                                            </div>

                                        </div>
                                    )
                                }
                                else {
                                    return (
                                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                            <div key={value.id} style={{ wordWrap: 'break-word', maxWidth: '70%', backgroundColor: '#333333', color: 'white', padding: '1.5%', margin: '1.2%', borderRadius: '15px' }}>{`${value.message}`}</div>

                                        </div>
                                    )
                                }
                            }
                            else {
                                if (value.role === 'peerA') {
                                    return (
                                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                            <div key={value.id} style={{ wordWrap: 'break-word', maxWidth: '70%', backgroundColor: '#333333', color: 'white', padding: '1.5%', margin: '1.2%', borderRadius: '15px' }}>
                                                {`${value.message}`}
                                            </div>

                                        </div>
                                    )
                                }
                                else {
                                    return (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <div key={value.id} style={{ wordWrap: 'break-word', maxWidth: '70%', backgroundColor: '#0A82FD', color: 'white', padding: '1.5%', margin: '1.2%', borderRadius: '15px' }}>{`${value.message}`}</div>
                                        </div>
                                    )
                                }

                            }
                        })
                    }
                </div>

                <form action="" onSubmit={sendMessage} style={{ backgroundColor: '#1a1a1a', width: '100%', height: '10%' }}>
                    <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <button type='button' onClick={handleCopy} className='copyBtn' style={{ padding: '2%', background: 'transparent', border: 'none', borderRadius: '5px', marginRight: '4%' }}>
                            <ContentPasteIcon style={{ transform: `scale(${1.2})`, width: '100%', color: 'rgb(26, 240, 161)' }} />
                        </button>
                        <input id='input-field' style={{ fontSize: '1.2vw', color: 'white', width: '70%', backgroundColor: '#333333', border: 'none', borderRadius: '5px' }} type='text' value={message} onChange={handleChange}></input>
                        <button type="submit" id='sendBtn' style={{ padding: '2%', background: 'transparent', border: 'none', borderRadius: '5px', marginLeft: '4%' }}>
                            <SendIcon style={{ transform: `scale(${1.5})`, width: '100%', color: 'rgb(26, 240, 161)' }} />
                        </button>
                    </footer>z
                </form>
            </div>
        </>
    );
}

export default Chat;