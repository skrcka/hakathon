var config = {
    type: Phaser.AUTO,
    width: Math.min(window.innerWidth, window.outerWidth),
    height: Math.min(window.innerHeight, window.outerHeight),
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

var game = new Phaser.Game(config);
var time = 0;
var enemyMove = 0;

var backgroundLayer;//mapa
var collisionLayer;
var itemsLayer;

var map;
var music;
var music_damage;
var music_damage;
var text;
var enemy;
var hammer;
var items;
var bombs;
var gameOver = false;
var left,right,up,down;
var enemyX = enemyY = 0;

var isCollision;

function preload ()
{
    this.load.spritesheet('robot', 'assets/lego.png',
        { frameWidth: 37, frameHeight: 48 } ); 

    this.load.spritesheet('items', 'assets/items.png', { frameWidth: 32, frameHeight: 32 } ); 
    this.load.spritesheet('hammer', 'assets/hammer.png', { frameWidth: 32, frameHeight: 32 } ); 

    this.load.image('tiles', 'assets/map_tiles.png');
    this.load.tilemapTiledJSON('json_map', 'assets/json_map.json');

    //AUDIO
    this.load.audio('bgMusic','assets/song.mp3');
    this.load.audio('damage','assets/kill.mp3');
}

function resize (width, height)
{

}	
	
function create ()
{
    //AUDIO
    music = this.sound.add('bgMusic');
    music_damage = this.sound.add('damage');

    music.play();

    isCollision = 0;
    map = this.make.tilemap({ key: 'json_map' });//json map 
    //F: 'map_tiles' - name of the tilesets in json_map.json
    //F: 'tiles' - name of the image in load.images()
    var tiles = map.addTilesetImage('map_tiles','tiles');

    backgroundLayer = map.createDynamicLayer('background', tiles, 0, 0);
    collisionLayer = map.createDynamicLayer('collision', tiles, 0, 0).setVisible(false);
    collisionLayer.setCollisionByExclusion([ -1 ]);
    
    items = this.physics.add.sprite(100, 150, 'items', 0);
    items.setBounce(0.1);
    
    hammer = this.physics.add.sprite(100, 450, 'hammer');
    this.physics.add.overlap(hammer, backgroundLayer);

    enemy = this.physics.add.sprite(200, 200, 'robot');
    enemy.setBounce(0.1);

    this.physics.add.collider(enemy, collisionLayer);
    this.physics.add.overlap(enemy, backgroundLayer);

    this.physics.add.overlap(hammer, enemy, collisionHandlerEnemy);
    
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
        key: 'run',
        frames: this.anims.generateFrameNumbers('robot', { start: 0, end: 16 }),
        frameRate: 20,
        repeat: -1
    }); 
    
    // cursors = this.input.keyboard.createCursorKeys();  

	this.input.on('pointermove', pointer_move);
	window.addEventListener('resize', function (event) {
		resize(Math.min(window.innerWidth, window.outerWidth), Math.min(window.innerHeight, window.outerHeight));
	}, false);
	resize(Math.min(window.innerWidth, window.outerWidth), Math.min(window.innerHeight, window.outerHeight));
}

function pointer_move(pointer) {
    hammer.x = pointer.x;
    hammer.y = pointer.y;
}

function update ()
{     
    enemyMove++;
    // náhodný pohyb po dvou sekundách
    if(enemyMove % 100 == 0){
        let randX = Math.floor(Math.random() * 60) + 40;
        let randY = Math.floor(Math.random() * 60) + 40;
        randX *= Math.floor(Math.random()*2) == 1 ? 1 : -1; 
        randY *= Math.floor(Math.random()*2) == 1 ? 1 : -1; 
        //console.log(randX, randY)
        if(randX < 0){
            enemy.angle = 90;
        }
        else if(randX > 0){
            enemy.angle = 270;
        }
        if(randY > 0){
            enemy.angle = 0;
        }
        else if(randY < 0){
            enemy.angle = 180;
        }
        enemyX = randX;
        enemyY = randY;
    }
    enemy.body.setVelocityX(enemyX);
    enemy.body.setVelocityY(enemyY);
    enemy.anims.play('run', true); 
}

function updateText ()
{
	text.setPosition(game.canvas.width/2 / map.scene.cameras.main.zoom + 50, text.height);
    //text.setText(
    //    'Score: ' + coinsCollected + '    Best score: ' + bestCollected
    //);
    text.setColor('white');
}

function collisionHandlerEnemy () {
    console.log("collision with enemy");
    music_damage.play();

    updateText();
}
