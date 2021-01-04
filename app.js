let boxContent=document.querySelectorAll('.box');
 
// boxContent.forEach(box => {
//     box.textContent='#A';
// });
const keys=document.querySelectorAll('.key');
console.log(keys)
keys.forEach(key =>{
    key.addEventListener('click',()=> palyNote(key))
})
function palyNote(key){
    const noteAudio=document.getElementById(key.dataset.note)
    noteAudio.currentTime=0;
    noteAudio.play();
    key.classList.add('active');
    noteAudio.addEventListener('ended',() => {
        key.classList.remove('active')
    });
}