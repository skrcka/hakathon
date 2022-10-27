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

var backgroundLayer;
var collisionLayer;
var itemsLayer;

var map;
var music;
var coinsCollected = 0;
var bestCollected = 0;
var text;
var player;
var enemy;
var items;
var bombs;
var gameOver = false;
var move_ctl = false;
var left,right,up,down;
var enemyX = enemyY = 0;

var isCollision;

function preload ()
{
    this.load.spritesheet('robot', 'assets/lego.png',
        { frameWidth: 37, frameHeight: 48 } ); 

    this.load.spritesheet('items', 'assets/items.png', { frameWidth: 32, frameHeight: 32 } ); 

    this.load.image('tiles', 'assets/map_tiles.png');
    this.load.tilemapTiledJSON('json_map', 'assets/json_map.json');

    //AUDIO
    this.load.audio('bgMusic','assets/song.mp3');
    this.load.audio('damage','assets/kill.mp3');
    this.load.audio('collect','assets/collect.mp3');
    
}

function resize (width, height)
{

}		
function create ()
{
    //AUDIO
    music = this.sound.add('bgMusic');
    music_damage = this.sound.add('damage');
    music_collect = this.sound.add('collect');

    music.play();

    isCollision = 0;
    map = this.make.tilemap({ key: 'json_map' });
    //F: 'map_tiles' - name of the tilesets in json_map.json
    //F: 'tiles' - name of the image in load.images()
    var tiles = map.addTilesetImage('map_tiles','tiles');

    backgroundLayer = map.createDynamicLayer('background', tiles, 0, 0);
    collisionLayer = map.createDynamicLayer('collision', tiles, 0, 0).setVisible(false);
    collisionLayer.setCollisionByExclusion([ -1 ]);
    
    items = this.physics.add.sprite(100, 150, 'items', 0);
    items.setBounce(0.1);
    
    player = this.physics.add.sprite(100, 450, 'robot');
    player.setBounce(0.1);

    enemy = this.physics.add.sprite(200, 200, 'robot');
    enemy.setBounce(0.1);
    
    
    this.physics.add.collider(player, collisionLayer);
    this.physics.add.overlap(player, backgroundLayer);

    this.physics.add.collider(enemy, collisionLayer);
    this.physics.add.overlap(enemy, backgroundLayer);
    
    //F:set collision range 
    backgroundLayer.setCollisionBetween(1, 25);    
       
    //F:Checks to see if the player overlaps with any of the items, 
    //f:if he does call the collisionHandler function
    this.physics.add.overlap(player, items, collisionHandler);
    this.physics.add.overlap(player, enemy, collisionHandlerEnemy);
    
    //this.cameras.main.startFollow(player);    
    var best = localStorage.getItem('bestScore');
    //console.log(best)
    if (best == null){
        localStorage.setItem('bestScore', 0);
        bestCollected = 0;
    }
    else{
        bestCollected = parseInt(best);
    }
 
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
    
    cursors = this.input.keyboard.createCursorKeys();  

	this.input.on('pointerdown', function (pointer) { 
		move_ctl = true; 
		pointer_move(pointer); 
	});
	this.input.on('pointerup', function (pointer) { move_ctl = false; reset_move()});
	this.input.on('pointermove', pointer_move);
	window.addEventListener('resize', function (event) {
		resize(Math.min(window.innerWidth, window.outerWidth), Math.min(window.innerHeight, window.outerHeight));
	}, false);		
	resize(Math.min(window.innerWidth, window.outerWidth), Math.min(window.innerHeight, window.outerHeight));
}

function pointer_move(pointer) {
		var dx=dy=0;
		//var min_pointer=20; // virtual joystick
		var min_pointer = (player.body.width + player.body.height) / 4 ; // following pointer by player
		if (move_ctl) {
			reset_move();
            /*			
            // virtual joystick
 			dx =  (pointer.x - pointer.downX); 
			dy = (pointer.y - pointer.downY);*/
			
			// following pointer by player
			dx = (pointer.x / map.scene.cameras.main.zoom - player.x);
			dy = (pointer.y / map.scene.cameras.main.zoom - player.y);
		    //console.log( 'Xp:'  + player.x + ', Xc:'  + pointer.x + ', Yp:' + player.y + ', Yc:' + pointer.y );
			
			if (Math.abs(dx) > min_pointer) {
				left = (dx < 0); 
				right = !left; 
			} else { 
				left = right = false;
			}
			if (Math.abs(dy) > min_pointer) {
				up = (dy < 0); 
				down = !up; 
			} else { 
				up = down = false;
			}
		}
		//console.log( 'L:'  + left + ', R:'  + right + ', U:' + up + ', D:' + down, ', dx: ' + dx + ',dy: ' + dy );
}

function reset_move() {
  up = down = left = right = false;
}

function update ()
{     
    time++;
    enemyMove++;

    if(time % 200 == 0 && time != 0){
        coinsCollected--;
        if(coinsCollected < 0){
            coinsCollected = 0;
        }
        time = 0;
        updateText();
    }
	// Needed for player following the pointer:
	if (move_ctl) { pointer_move(game.input.activePointer); }
	
    // Horizontal movement
    if (cursors.left.isDown || left)
    {
        player.body.setVelocityX(-150);
        player.angle = 90;
        player.anims.play('run', true); 
    }
    else if (cursors.right.isDown || right)
    {
        player.body.setVelocityX(150);
        player.angle = 270;
        player.anims.play('run', true); 
    }
    else
    {
        player.body.setVelocityX(0);
    }

    // Vertical movement
    if (cursors.up.isDown || up)
    {
        player.body.setVelocityY(-150);
        player.angle = 180;
        player.anims.play('run', true); 
    }
    else if (cursors.down.isDown || down)
    {
        player.body.setVelocityY(150);
        player.anims.play('run', true); 
        player.angle = 0;
    }
    else
    {
        player.body.setVelocityY(0);
    }
    // náhodný pohyb po dvou sekundách
    if(enemyMove % 100 == 0){
        randX = Math.floor(Math.random() * 60) + 40;
        randY = Math.floor(Math.random() * 60) + 40;
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
    //console.log(enemyX, enemyY)

    enemy.body.setVelocityX(enemyX);
    enemy.body.setVelocityY(enemyY);
    enemy.anims.play('run', true); 
}

function updateText ()
{
	text.setPosition(game.canvas.width/2 / map.scene.cameras.main.zoom + 50, text.height);
    text.setText(
        'Score: ' + coinsCollected + '    Best score: ' + bestCollected
    );
    text.setColor('white');
}

// If the player collides with items
function collisionHandler (player, item) {   
    music_collect.play();
    coinsCollected += 1;

    if (coinsCollected > bestCollected) { bestCollected = coinsCollected; localStorage.setItem('bestScore', coinsCollected) }
    updateText();

    time = 0;
    item.disableBody(true, true);
      
    if (item.body.enable == false)
    {
        var h = map.heightInPixels-40;
        var w = map.widthInPixels-40;
        var itemX = Phaser.Math.Between(40, w);
        var itemY = Phaser.Math.Between(40, h);
        var itemID = Phaser.Math.Between(0, 118);
        item.setFrame(itemID);
        item.enableBody(true, itemX, itemY, true, true);
    }
       
}
function collisionHandlerEnemy () {   
    console.log("collision with enemy");
    music_damage.play();

    coinsCollected = 0;
    updateText();
}
