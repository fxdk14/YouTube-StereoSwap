// ==UserScript==
// @name         YouTube StereoSwap by fxdk
// @namespace    https://tampermonkey.net/
// @version      1.0
// @description  Adds a toggle button to YouTube to swap audio channels (left/right)
// @author       fxdk_
// @match        *://www.youtube.com/*
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    let audioContext, sourceNode, splitterNode, mergerNode, isSwapped = false;

    function initAudio() {
        if (audioContext) return true;

        const video = document.querySelector('video');
        if (!video) return false;

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            sourceNode = audioContext.createMediaElementSource(video);
            splitterNode = audioContext.createChannelSplitter(2);
            mergerNode = audioContext.createChannelMerger(2);

            sourceNode.connect(splitterNode);
            splitterNode.connect(mergerNode, 0, 0);
            splitterNode.connect(mergerNode, 1, 1);
            mergerNode.connect(audioContext.destination);

            if (audioContext.state === 'suspended') audioContext.resume();
            return true;
        } catch (e) {
            console.error('Audio initialization failed:', e);
            return false;
        }
    }

    function toggleAudioChannels() {
        if (!initAudio()) {
            alert('YouTube StereoSwap by fxdk: Unable to initialize audio context. The video element may already be connected to another AudioContext.');
            return;
        }

        disconnectNodes();

        if (!isSwapped) {
            splitterNode.connect(mergerNode, 0, 1);
            splitterNode.connect(mergerNode, 1, 0);
        } else {
            splitterNode.connect(mergerNode, 0, 0);
            splitterNode.connect(mergerNode, 1, 1);
        }

        isSwapped = !isSwapped;
        updateButtonState(isSwapped);
        console.log(`Audio channels ${isSwapped ? 'swapped' : 'restored'}`);
    }

    function disconnectNodes() {
        try {
            splitterNode.disconnect();
            mergerNode.disconnect();
        } catch (e) {
            console.warn('Error disconnecting nodes:', e);
        }
    }

    function updateButtonState(swapped) {
        const button = document.querySelector('.custom-audio-toggle');
        if (button) {
            const toggleButton = button.querySelector('.ytp-autonav-toggle-button');
            if (toggleButton) {
                toggleButton.setAttribute('aria-checked', swapped.toString());
            }
            const label = swapped ? 'Audio Channels Swapped' : 'Audio Channels Normal';
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);
        }
    }

    function createToggleButton() {
        const button = document.createElement('button');
        button.className = 'ytp-button custom-audio-toggle';
        button.setAttribute('aria-label', 'Audio Channels Normal');
        button.setAttribute('title', 'Audio Channels Normal');

        const container = document.createElement('div');
        container.className = 'ytp-autonav-toggle-button-container';

        const toggleButton = document.createElement('div');
        toggleButton.className = 'ytp-autonav-toggle-button';
        toggleButton.setAttribute('aria-checked', 'false');

        container.appendChild(toggleButton);
        button.appendChild(container);

        button.addEventListener('click', toggleAudioChannels);

        return button;
    }

    function addButtonToControls() {
        const controls = document.querySelector('.ytp-right-controls');
        if (controls && !controls.querySelector('.custom-audio-toggle')) {
            const toggleButton = createToggleButton();
            controls.insertBefore(toggleButton, controls.firstChild);
        }
    }

    const observer = new MutationObserver(() => {
        addButtonToControls();
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
