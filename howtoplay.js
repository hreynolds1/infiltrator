hp=0
function changehp(){
    if (hp){hp-=1}else{hp=3}
    document.getElementById("soldier").src="./images/soldierred"+hp+".png"
}