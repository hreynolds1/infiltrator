gamegrid=[]
gameobjects=[]
//used for identifying stuff later
var soldierselected=false
selectedsoldier=false
//soldierselected --> has a soldier been selected yet
//selectedsoldier --> the soldier which is selected
//the variable names are confusing but i'm not bothered to change them back lol

currentturn="blue"
phase="moving"
console.log("Phase: "+phase)
charactersmoved=0
//turn details

String.prototype.capitalise=function(){
    return this.charAt(0).toUpperCase() + this.slice(1);
}
function arraysEqual(a, b) {
    //checks if two arrays are equal
    //100% definitey totally didn't steal this from StackOverflow
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
  
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
      //loops through all the items in the array and returns false if they don't match
    }
    return true;
}

function getline(x1,y1,x2,y2,interval=0.1,round=false){
    //makes a list of coordinates between two points, used for line of sight
    linecoords=[]
    var gradient=(y2-y1)/(x2-x1)
    constant=x1*gradient*-1+y1
    if (isFinite(gradient)){
        for (n=x1;n<x2+interval;n+=interval){
            switch(gradient){
                case 0:
                    //horizontal line
                    coords=[n,y1]
                    break;
                default:
                    //diagonal line
                    coords=[n,n*gradient+constant]
                    break;
            }
            if (round){
                coords[0]=Math.round(coords[0])
                coords[1]=Math.round(coords[1])
            }
            linecoords.push(coords)
        }
    } else{
        for (n=y1;n<y2+interval;n+=interval){
            //vertical line
            coords=[x1,n]
            if (round){
                coords[0]=Math.floor(coords[0])
                coords[1]=Math.floor(coords[1])
            }
            linecoords.push(coords)
        }
    }
    return linecoords
}

function opposite(item,array,opposite){
    return array[opposite.indexOf(item)];
}//gives the opposite of an item in its array, used for toggling the turn slightly more efficiently
//honestly idk why I need this


function getdistance(ele1,ele2){
    //finds distance on grid between two html elements
    x1=ele1.xpos
    y1=ele1.ypos
    x2=ele2.xpos
    y2=ele2.ypos
    return Math.sqrt(Math.pow(Math.max(x1,x2)-Math.min(x1,x2),2)+Math.pow(Math.max(y1,y2)-Math.min(y1,y2),2))
}
//used for making sure soldiers don't move >1 tile at a time, and shoot >3 tiles away

function checkaround(ele,viewdistance){
    //returns a list of all the elements within x distance of the element given
    detected=[]
    for (i in gamegrid){
        for (j in gamegrid[i]){
            if (getdistance(gamegrid[i][j],ele)<viewdistance){
                detected.push(gamegrid[i][j])
            }
        }
    }
    return detected
}

function checkcollision(startele,finishele,line,show){
    //checks if there's an object in the coordinate line given
    //line is obtained from getline()
    collision=false
    for (point in line){
        element=gamegrid[line[point][1]][line[point][0]]
        if(show){element.classList.add("green")}
        if (element.children.length && element!=startele.parentNode && element!=finishele){
            collision=true
            if(show){
                element.classList.remove("green")
                element.classList.add("bad")
            }
        }
    }
    return collision
} //used for line of sight

class gameobject{
    //why did I make an object class rather than just using the HTML element? god knows
    //but I'm definitely not gonna revert it
    constructor(team,moveable,health,canattack,x,y,sprite,type){
        this.team=team
        this.moveable=moveable
        this.health=health
        this.canattack=canattack
        this.x=x
        this.y=y
        this.sprite=sprite
        this.element=document.createElement("IMG")
        this.element.src=sprite
        this.element.classList.add("gamesprite")
        this.element.xpos=x
        this.element.ypos=y
        this.element.team=team
        this.element.type=type
        this.movesthisturn=0
        this.canmove=true
        //set the variable stuffs
        gameobjects.push(this)
        this.element.gameid=gameobjects.indexOf(this)
        //used later for converting HTML elements to code objects, again, no idea why I didn't just use the HTML element
        //but I'm not fixing it
        gamegrid[y][x].appendChild(this.element)
        var self=this
        //used for identifying the element in timeouts
        this.move=function(x,y){
            //moves the corresponding element from one div to another
            this.element.parentNode.removeChild(this.element)
            gamegrid[y][x].appendChild(this.element)
            this.element.xpos=x
            this.element.ypos=y
            this.deselect(0)
            if (this.movesthisturn==0){
                charactersmoved+=1
            }
            this.movesthisturn+=1
            if (this.movesthisturn>2){
                this.canmove=false
            }
            if (arraysEqual([this.element.ypos,this.element.xpos],mine1) || arraysEqual([this.element.ypos,this.element.xpos],mine2) || arraysEqual([this.element.ypos,this.element.xpos],mine3)){
                this.hit()
                selectedsoldier.canmove=false
            }
        }

        this.deselect=function(timeout){
            setTimeout(function(){self.element.classList.remove("green")},timeout)
        }
        //removes the green selection thing from around the item

        this.hit=function(){
            selectedsoldier.canattack=false
            //limits soldiers to attacking once per turn
            var originalsrc=this.element.src
            this.health-=1
            if (this.element.type=="soldier"){
                this.element.src="./images/soldier"+this.team+this.health+".png"
                originalsrc=this.element.src
                //kaboom animation but for soldiers
            }
            if (this.sprite=="./images/barackobama.png"){
                //updates barrack HP
                if (this.team=="blue"){
                    document.getElementById("bluehp").innerHTML=this.health
                } else {
                    document.getElementById("redhp").innerHTML=this.health
                }
            }
            if (this.health==0){
                this.die()
            } else {
                this.element.src="./images/boom.png"
                setTimeout(function(){self.element.src=originalsrc},300)
                //kaboom animation
            }

        }

        this.die=function(){
            //for when this .dies()
            this.element.src="./images/boom.png"
            if (this.sprite=="./images/barackobama.png"){
                var bottombar=document.getElementById("turncontrol")
                bottombar.innerHTML=""
                //removes the buttons from the bottom bar
                var winner=document.createElement("H1")
                var restart=document.createElement("BUTTON")
                winner.style.display="inline"
                restart.innerHTML="Restart"
                restart.style.marginLeft="20px"
                restart.style.fontSize="30px"
                //replaces them with new stuff
                restart.onclick=function(){window.location.href=""}
                //button to refresh the page
                if (this.team=="blue"){
                    winner.style.backgroundColor="rgb(235, 64, 52)"
                    winner.textContent="Red wins!"
                } else {
                    winner.style.backgroundColor="rgb(49, 71, 214)"
                    winner.textContent="Blue wins!"
                }
                bottombar.appendChild(winner)
                bottombar.appendChild(restart)
            }
            setTimeout(function(){self.element.remove()},300)
        }
    
        if (moveable){this.element.onclick=function(){selectsoldier(self)}}
        //lets you select soldiers and stuff
    }
}


function randint(low, high) {
    return Math.round((Math.random() * (high-low))+low)
}//RNG


function selectsoldier(obj){
    //used to pick which soldier you want to move/shoot with
    switch(true){
        case soldierselected && obj.team!=currentturn && phase=="shooting" && obj.element.classList.contains("green"): 
            //shoot a soldier, needs separate code to objects so that soldier doesn't just get selected
            obj.hit()
            soldierselected=false
            selectedsoldier.deselect(0)
            selectedsoldier=false
            console.log("point 2 - shot fired (human)")
            break;
        case obj.team==currentturn && ((phase=="moving" && obj.canmove && (charactersmoved<3 || (obj.movesthisturn>0 && obj.movesthisturn<3))) || ((phase=="shooting" || phase=="building") && obj.canattack)):
            //move to a spot
            try{
                for (i in neighbouring){
                    neighbouring[i].classList.remove("green")
                    if (neighbouring[i].classList.contains("bad")){
                        neighbouring[i].classList.remove("bad")
                        neighbouring[i].children[0].classList.remove("bad")
                    }
                    //removes the selection effect from other items
                }
            }catch{}
            if (phase=="moving" || phase=="building"){
                neighbouring=checkaround(obj.element,2)
                for (i in neighbouring){
                    if (!(neighbouring[i].children.length && !(checkcollision(obj.element,neighbouring[i],getline(obj.element.xpos,obj.element.ypos,neighbouring[i].xpos,neighbouring[i].ypos,0.1,true),false)))){neighbouring[i].classList.add("green")}
                }
            } else {
                neighbouring=checkaround(obj.element,4)
                for (i in neighbouring){
                    //console.log(checkcollision(getline(obj.element.xpos,obj.element.ypos,neighbouring[i].xpos,neighbouring[i].ypos,0.1,true),false))
                    if (neighbouring[i].children.length && neighbouring[i].children[0].team!=currentturn && !(checkcollision(obj.element,neighbouring[i],getline(obj.element.xpos,obj.element.ypos,neighbouring[i].xpos,neighbouring[i].ypos,0.1,true),false))){
                        neighbouring[i].classList.add("green")
                        neighbouring[i].children[0].classList.add("green")
                    }
                }
            }

            try{if (selectedsoldier!=obj){selectedsoldier.deselect(0)}}catch{}
            soldierselected=true
            selectedsoldier=obj
            document.addEventListener('click',selectele)
            obj.element.classList.add("green")
            //I wrote this way too late at night so I don't even remember what this does tbh
            break;
        default:
            obj.element.classList.add("bad")
            setTimeout(function(){obj.element.classList.remove("bad")},300)
            //makes things flash red if they can't be selected
            break;

    }

}

function selectele(e){
    //selects an element to build on, move to, shoot, etc.
    e = e || window.event;
    var target = e.target || e.srcElement
    if (e.target.tagName!="IMG" && !(e.target.children.length) && target.classList.contains("green") && phase!="shooting"){
        for (i in neighbouring){
            neighbouring[i].classList.remove("green")
        }
        //removes the previous green selection boxes
        if (phase=="moving"){
            selectedsoldier.move(target.xpos,target.ypos)
        }
        if (phase=="building" && selectedsoldier.canattack){
            wall=new gameobject("none",false,1,false,target.xpos,target.ypos,"./images/wall.jpg","object")
            selectedsoldier.deselect(0)
            selectedsoldier.canattack=false
        }
        document.removeEventListener('click',selectele)
        soldierselected=false
        //deselects the soldier and moves them/builds a wall
    } else {
        if (target.team!=selectedsoldier.team && soldierselected && target.type=="object" && phase=="shooting" && selectedsoldier.canattack && target.classList.contains("green")){
            //code for shooting objects
            shottarget=gameobjects[target.gameid]
            shottarget.hit()
            console.log("point 1 - shot fired (object)")
            selectedsoldier.deselect(0)
            soldierselected=false
            selectedsoldier=false
            for (i in neighbouring){
                neighbouring[i].classList.remove("green")
                try{
                    neighbouring[i].children[0].classList.remove("green")
                }catch{}
            }
            //deselects the soldier and removes the green selection boxes around them
        }
    }
}


function finishturn(){
    try{selectedsoldier.deselect(0)}catch{}
    bottombar=document.getElementById("turncontrol")
    selectedsoldier=false
    thing=currentturn
    //variable naming conventions
    currentturn=opposite(thing,["red","blue"],["blue","red"])
    colours=["red","blue"]
    buttoncolours=["rgb(235, 88, 52)","rgb(59, 167, 255)"]
    overallcolours=["rgb(235, 64, 52)","rgb(49, 71, 214)"]
    colourindex=colours.indexOf(currentturn)
    bottombar.style.backgroundColor=overallcolours[colourindex]
    for (i=0;i<bottombar.children.length-1;i++){
        bottombar.children[i].style.backgroundColor=buttoncolours[colourindex]
    }
    document.getElementById("player").innerHTML=colours[colourindex].capitalise()
    document.getElementById("player").style.backgroundColor=overallcolours[colourindex]
    document.getElementById("status").style.backgroundColor=overallcolours[colourindex]
    document.getElementById("currentphase").innerHTML="moving"
    document.getElementById("currentphase").style.backgroundColor=overallcolours[colourindex]
    //sets the colour and innerHTML of the stuff in the bottom bar according to whose turn it is
    soldierselected=false
    phase="moving"
    charactersmoved=0
    for (i=0;i<10;i++){
        bluesoldiers[i].movesthisturn=0
        bluesoldiers[i].canmove=true
        bluesoldiers[i].canattack=true
        redsoldiers[i].movethisturn=0
        redsoldiers[i].canmove=true
        redsoldiers[i].canattack=true
    }
    //lets all the soldiers move again
}

function newphase(arg){
    //oh gee, I wonder what this does
    try{
        for (i in neighbouring){
            neighbouring[i].classList.remove("green")
            if (neighbouring[i].children.length){
                neighbouring[i].children[0].classList.remove("green")
            }
        }
    }catch(err){console.log(err)}

    try{selectedsoldier.deselect(0)}catch{}
    phase=arg
    document.getElementById("currentphase").innerHTML=phase
}

gridsize=12
for (i=0;i<gridsize;i++){
    newline=[]
    for (j=0;j<gridsize;j++){
        newdiv=document.createElement("DIV")
        newdiv.xpos=j
        newdiv.ypos=i
        document.getElementById("gamegrid").appendChild(newdiv)
        newline.push(newdiv)
    }
    gamegrid.push(newline)
    //generates the starting grid
}

bluebase=new gameobject("blue",false,10,false,0,6,"./images/barackobama.png","object")
redbase=new gameobject("red",false,10,false,11,6,"./images/barackobama.png","object")
//based

bluesoldiers=[]
for (i=0;i<10;i++){
    soldier=new gameobject("blue",true,3,true,1,1+i,"./images/soldierblue3.png","soldier")
    bluesoldiers.push(soldier)
}

redsoldiers=[]
for (i=0;i<10;i++){
    soldier=new gameobject("red",true,3,true,10,i+1,"./images/soldierred3.png","soldier")
    redsoldiers.push(soldier)
}
//makes an army

rocks=randint(20,40)
for (i=0;i<rocks;i++){
    rockpos=[randint(0,gridsize-1),randint(0,gridsize-1)]
    if (!(gamegrid[rockpos[0]][rockpos[1]].children.length)){
        new gameobject("rock",false,2,false,rockpos[1],rockpos[0],"./images/rock.png","object");
    }
}
//makes an army but they're rocks instead of people
//rock together strong

mine1=[randint(0,gridsize-1),randint(0,gridsize-1)]
mine2=[randint(0,gridsize-1),randint(0,gridsize-1)]
mine3=[randint(0,gridsize-1),randint(0,gridsize-1)]
//And Frankie kicked a mine the day that mankind kicked the moon
