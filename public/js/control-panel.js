var controlPanel = document.querySelector(".right-control-panel");
var openControlPanelBtn = document.querySelector("#open-controls-btn");
var closeControlPanelBtn = document.querySelector("#close-controls-btn");
var inviteLinkBox = document.querySelector("#link-input");
var copyLinkBtn = document.querySelector("#copy-invite-link-btn");
var copiedPopup = document.querySelector(".copied-to-clipboard");

function togglePanel(){
    console.log("button working");
    controlPanel.classList.toggle("slide-out");
}

openControlPanelBtn.addEventListener("click", togglePanel);
closeControlPanelBtn.addEventListener("click", togglePanel);

inviteLinkBox.value = window.location.href;

function copyAndShowPopup(){
    var linkToCopy = inviteLinkBox.value;
    window.getSelection().removeAllRanges();    // deselect anything selected previously
    inviteLinkBox.select();    //select the text in the input box

    // copy whatever is selected. If returns true, show msg
    if (document.execCommand("copy")) {
        console.log("Copied");
        copyLinkBtn.removeEventListener("click", copyAndShowPopup);
        copiedPopup.style.display = "flex";        
        copiedPopup.style.transitionDuration = "3s";

        // vanishes the popup
        setTimeout(function(){
            console.log("fully vanished");
            copiedPopup.style.opacity = "0%";
        }, 500);  //waits half a second and then vanishes slowly

        // gets ready for next click
        setTimeout(function(){
            console.log("ready for next one");
            copiedPopup.style.display = "none";
            copiedPopup.style.transitionDuration = "0s";
            copiedPopup.style.opacity = "100%";
            copyLinkBtn.addEventListener("click", copyAndShowPopup)
        }, 3000);  //waits 3 seconds for popup to fully disappear

    }else{
        console.log("Could not be copied");
    }
    window.getSelection().removeAllRanges();   //deselect the input box selection
}

copyLinkBtn.addEventListener("click", copyAndShowPopup)
    
