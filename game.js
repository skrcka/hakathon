const config = {
    type: Phaser.AUTO,
    parent: 'phaser-app',
    scale: {
        mode: Phaser.Scale,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },    
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    debug: true
};

let game = new Phaser.Game(config);
let time = 0;
let enemyMove = 0;

let backgroundLayer;//mapa
let collisionLayer;
let itemsLayer;

let scale;

let maxHealth = 3;
let curHealth = maxHealth;
let alive = 1;



let map;
let music;
let music_damage;
let sound_bonk;
let text;
let hammer;
let items;
let bombs;
let gameOver = false;
let left,right,up,down;

let enemies = [];
let enemiesTimer = [];

let isCollision;

function preload ()
{
    this.load.spritesheet('robot', 'assets/lego.png',
        { frameWidth: 37, frameHeight: 48 } ); 
    //this.load.spritesheet('krtek', 'assets/Krtek_animace_rescale.png',
    //    { frameWidth: 107, frameHeight: 118} );
    this.load.spritesheet('krtek', 'assets/Krtek_rescale.png',
        { frameWidth: 64, frameHeight: 70} );

    this.load.spritesheet('items', 'assets/items.png', { frameWidth: 32, frameHeight: 32 } ); 
    this.load.spritesheet('hammer', 'assets/hammer.png', { frameWidth: 32, frameHeight: 32 } ); 

    this.load.image('tiles', 'assets/map_tilesew.png');
    this.load.tilemapTiledJSON('json_map', 'assets/json_map.json');
    
    //this.load.image('tiles', 'assets/img64.png');
    //this.load.image('tiles', 'assets/MapTiltes.png');
    //this.load.tilemapTiledJSON('json_map', 'assets/DanMap.json');

    

    //AUDIO
    this.load.audio('bgMusic','assets/song.mp3');
    this.load.audio('damage','assets/kill.mp3');
    this.load.audio('bonk','assets/bonk.mp3');
    this.load.audio('healthMinus','assets/aughMinus.mp3');
    this.load.audio('healthDeath','assets/aughDeath.mp3');
}

function lostText(){

}

function resize(width, height){
    scale.displaySize.setAspectRatio(width/height);
    scale.refresh();
}

function create ()
{
    scale = this.scale;
    resize(Math.min(window.innerWidth, window.outerWidth), Math.min(window.innerHeight, window.outerHeight));
    //AUDIO
    music = this.sound.add('bgMusic');
    music_damage = this.sound.add('damage');
    sound_bonk = this.sound.add('bonk');
    sound_healthMinus = this.sound.add('healthMinus');
    sound_healthDeath = this.sound.add('healthDeath');
    //music.play();

  
    map = this.make.tilemap({ key: 'json_map' });//json map 
    //F: 'map_tiles' - name of the tilesets in json_map.json
    //F: 'tiles' - name of the image in load.images()
    let tiles = map.addTilesetImage('map_tilesew','tiles');

    backgroundLayer = map.createDynamicLayer('background', tiles, 0, 0);
    collisionLayer = map.createDynamicLayer('collision', tiles, 0, 0).setVisible(false);
    collisionLayer.setCollisionByExclusion([ -1 ]);
    
    items = this.physics.add.sprite(100, 150, 'items', 0);
    items.setBounce(0.1);
    
    hammer = this.physics.add.sprite(100, 450, 'hammer');
    this.physics.add.overlap(hammer, backgroundLayer);
    
    //F:set collision range 
    backgroundLayer.setCollisionBetween(1, 25);    
       
    
    text = this.add.text(game.canvas.width/2, 16, '', {
        fontSize: '3em',
        fontFamily: 'fantasy',
        align: 'center',
        boundsAlignH: "center", 
        boundsAlignV: "middle", 
        fill: '#ffffff'
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);    
    updateText();
    
    
    this.anims.create({
        key: 'birth',
        frames: this.anims.generateFrameNumbers('robot', { start: 0, end: 16 }),
        frameRate: 5,
        repeat: 0
    });
    this.anims.create({
        key: 'alive',
        frames: this.anims.generateFrameNumbers('robot', { start: 8, end: 12 }),
        frameRate: 80,
        repeat: -1
    });
    this.anims.create({
        key: 'die',
        frames: this.anims.generateFrameNumbers('robot', { start: 16, end: 0, step:-1 }),
        frameRate: 20,
        repeat: 0
    });
    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('krtek', {start: 0, end: 12 }),
        frameRate: 10,
        repeat:0
    });
    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('krtek', {start: 12, end: 0, step:-1 }),
        frameRate: 10,
        repeat:0
    });
    
    this.anims.create({
        key: 'kill',
        frames: this.anims.generateFrameNumbers('krtek', {start: 13, end: 26 }),
        frameRate: 10,
        repeat:0
    });
    
    // cursors = this.input.keyboard.createCursorKeys();  

	this.input.on('pointermove', pointer_move);
	/*
    window.addEventListener('resize', function (event) {
		this.scale.displaySize.setAspectRatio( width/height );
        this.scale.refresh();
	}, false);
    */
}

function updateText ()
{
	text.setPosition(game.canvas.width/2 / map.scene.cameras.main.zoom + 50, text.height);
    text.setText(
        'Počet životů ' + curHealth
    );
    text.setColor('white');
}

function pointer_move(pointer) {
    hammer.x = pointer.x;
    hammer.y = pointer.y;
}

//MATEMATIKA
function letterY(start, end){
    

}


function update ()
{     
    time++;
    if(alive){
        if(time % 80 == 0 && Math.random() > 0.5 && enemies.length < 10) {
            let x = Math.floor(Math.random() *  800)/*window.innerWidth)*/;
            let y = Math.floor(Math.random() * 500)/*window.innerHeight)*/;
            console.log(`spawn: ${x} ${y}`);
            let enemy = this.physics.add.sprite(x, y, 'krtek');
            enemy.setBounce(0.1);
            enemies.push(enemy);
            enemiesTimer.push(setTimeout(()=>{reduceHealth(enemy)}, 3000));
            enemy.anims.play('up', true); 
            enemy.dead = false;

            //this.physics.add.collider(enemy, collisionLayer);
            this.physics.add.overlap(enemy, backgroundLayer);
            this.physics.add.overlap(hammer, enemy, () => { collisionHandlerEnemy(enemy) });
        }
    }
        else if(time % 5 == 0)
        {
            
            let x = Math.floor(Math.random() *  800)/*window.innerWidth)*/;
            let y = Math.floor(Math.random() * 500)/*window.innerHeight)*/;
            let enemy = this.physics.add.sprite(x, y, 'krtek');
            enemy.anims.play('up', true);
            //if(time % 100 == 0)
                //sound_healthDeath.play();
            //DOPSAT YOU LOST
        }
    updateText();
    if(curHealth <= 0){
        console.log('big homo');
        text.setText('you dieded axaxa');
    }
}

function reduceHealth(enemy){
    if(enemy.dead)
        return;
    else
        {
        removeEnemy(enemy, 0);
        }   
    curHealth--;
    if(curHealth == 0){
        sound_healthDeath.play();
        alive = 0;
    }
    else if(alive)
        sound_healthMinus.play();




}
//*removeparam, 1 - died, 0 - alive

function removeEnemy(enemy, removeParam){

    let index = enemies.indexOf(enemy);
    console.log(index);
    enemies.splice(index, 1);
    enemiesTimer.splice(index, 1);
    if(removeParam){
        enemy.anims.play('kill', true); 
        setTimeout(()=>{
            enemy.destroy(true);
        }, 1300);
    }
    else{
        enemy.anims.play('down', true);
        setTimeout(()=>{
            enemy.destroy(true);
        },1300);
        }
}


function collisionHandlerEnemy(enemy) {

    if(enemy.dead)
        return;
    enemy.dead = true;
    sound_bonk.play();
    removeEnemy(enemy, 1);


    //updateText();
}
