const config = {
    type: Phaser.AUTO,
    parent: 'phaser-app',
    scale: {
        mode: Phaser.Scale.FIT,
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

let map;
let music;
let music_damage;
let text;
let hammer;
let items;
let bombs;
let gameOver = false;
let left,right,up,down;

let enemies = [];

let isCollision;

function preload ()
{
    this.load.spritesheet('robot', 'assets/lego.png',
        { frameWidth: 37, frameHeight: 48 } ); 

    this.load.spritesheet('items', 'assets/items.png', { frameWidth: 32, frameHeight: 32 } ); 
    this.load.spritesheet('hammer', 'assets/hammer.png', { frameWidth: 32, frameHeight: 32 } ); 

    this.load.image('tiles', 'assets/map_tiles.png');
    this.load.tilemapTiledJSON('json_map', 'assets/json_map.json');
    
    //this.load.image('tiles', 'assets/img64.png');
    //this.load.image('tiles', 'assets/MapTiltes.png');
    //this.load.tilemapTiledJSON('json_map', 'assets/DanMap.json');

    

    //AUDIO
    this.load.audio('bgMusic','assets/song.mp3');
    this.load.audio('damage','assets/kill.mp3');
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

    music.play();

  
    map = this.make.tilemap({ key: 'json_map' });//json map 
    //F: 'map_tiles' - name of the tilesets in json_map.json
    //F: 'tiles' - name of the image in load.images()
    let tiles = map.addTilesetImage('map_tiles','tiles');

    backgroundLayer = map.createDynamicLayer('background', tiles, 0, 0);
    collisionLayer = map.createDynamicLayer('collision', tiles, 0, 0).setVisible(false);
    collisionLayer.setCollisionByExclusion([ -1 ]);
    
    items = this.physics.add.sprite(100, 150, 'items', 0);
    items.setBounce(0.1);
    
    hammer = this.physics.add.sprite(100, 450, 'hammer');
    this.physics.add.overlap(hammer, backgroundLayer);
    
    //F:set collision range 
    backgroundLayer.setCollisionBetween(1, 25);    
       
    /*
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
    */
    
    this.anims.create({
        key: 'run',
        frames: this.anims.generateFrameNumbers('robot', { start: 0, end: 16 }),
        frameRate: 20,
        repeat: 0
    });
    this.anims.create({
        key: 'wait',
        frames: this.anims.generateFrameNumbers('robot', { start: 8, end: 12 }),
        frameRate: 20,
        repeat: -1
    });
    this.anims.create({
        key: 'die',
        frames: this.anims.generateFrameNumbers('robot', { start: 16, end: 0, step:-1 }),
        frameRate: 20,
        repeat: 0
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

function pointer_move(pointer) {
    hammer.x = pointer.x;
    hammer.y = pointer.y;
}

function update ()
{     
    time++;
    if(time % 30 == 0 && Math.random() > 0.5 && enemies.length < 10) {
        let x = Math.floor(Math.random() * window.innerWidth);
        let y = Math.floor(Math.random() * window.innerHeight);
        console.log(`spawn: ${x} ${y}`);
        let enemy = this.physics.add.sprite(x, y, 'robot');
        enemy.setBounce(0.1);
        enemies.push(enemy);
        enemy.anims.play('run', true); 
        enemy.dead = false;

        //this.physics.add.collider(enemy, collisionLayer);
        this.physics.add.overlap(enemy, backgroundLayer);
        this.physics.add.overlap(hammer, enemy, () => { collisionHandlerEnemy(enemy) });
    }
}

function updateText ()
{
	text.setPosition(game.canvas.width/2 / map.scene.cameras.main.zoom + 50, text.height);
    //text.setText(
    //    'Score: ' + coinsCollected + '    Best score: ' + bestCollected
    //);
    text.setColor('white');
}

function collisionHandlerEnemy(enemy) {
    if(enemy.dead)
        return;
    enemy.dead = true;
    let index = enemies.indexOf(enemy);
    console.log(index);
    enemies.splice(index, 1);
    
    enemy.anims.stop('run', true);
    enemy.anims.play('die', true); 
    setTimeout(()=>{
        enemy.destroy(true);
        music_damage.play();
    }, 1000);

    //updateText();
}
