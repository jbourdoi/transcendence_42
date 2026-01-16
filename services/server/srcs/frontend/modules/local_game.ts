export enum GameState
{
    NEW_GAME,
    PLAYING,
    PAUSED,
    GAME_OVER
}

export class Arena {
    // Dimensions logiques (ratio 16/9)
    readonly width = 16;
    readonly height = 9;

    // Contraintes d'affichage
    readonly minPixelWidth = 640;
    readonly minPixelHeight = 360;

    // Proportions
    readonly paddleHeightRatio = 0.25;   // 25% de la hauteur
    readonly paddleWidthRatio = 0.015;   // largeur relative
    readonly ballRadiusRatio = 0.012;    // proportion de la largeur
    readonly paddleSpeedRatio = 0.9;     // hauteur / seconde
}


export class Vector2
{
    constructor(public x: number, public y: number) {}

    add(v: Vector2): void {
        this.x += v.x;
        this.y += v.y;
    }
}

export class Paddle
{
    position: Vector2;
    width: number;
    height: number;
    speed: number;

    constructor(
        readonly x: number,
        readonly arena: Arena,
        readonly upKey: string,
        readonly downKey: string
    ) {
        this.height = arena.height * arena.paddleHeightRatio;
        this.width = arena.width * arena.paddleWidthRatio;
        this.speed = arena.height * arena.paddleSpeedRatio;
        this.position = new Vector2(x, (arena.height - this.height) / 2);
    }

	init()
	{
        this.position = new Vector2(this.x, (arena.height - this.height) / 2);
	}

    update(dt: number, input: Set<string>): void {
        if (input.has(this.upKey)) this.position.y -= this.speed * dt;
        if (input.has(this.downKey)) this.position.y += this.speed * dt;

        this.position.y = Math.max(
            0,
            Math.min(this.arena.height - this.height, this.position.y)
        );
    }
}

export class Ball
{
    readonly radius: number;
    position: Vector2;
    velocity: Vector2;

    constructor(readonly arena: Arena) {
        this.radius = arena.width * arena.ballRadiusRatio;
        this.position = new Vector2(arena.width / 2, arena.height / 2);
        this.velocity = new Vector2(arena.width * 0.5, arena.height * 0.3);
    }

    reset(direction: number): void {
        this.position.x = this.arena.width / 2;
        this.position.y = this.arena.height / 2;
        this.velocity.x = direction * this.arena.width * 0.5;
        this.velocity.y = (Math.random() - 0.5) * this.arena.height * 0.6;
    }

    update(dt: number): void {
        this.position.add(new Vector2(
            this.velocity.x * dt,
            this.velocity.y * dt
        ));

        if (
            this.position.y - this.radius < 0 ||
            this.position.y + this.radius > this.arena.height
        ) {
            this.velocity.y *= -1;
        }
    }
}

export class GameModel
{
    state = GameState.NEW_GAME;
    isTournament: boolean = false;
    leftScore = 0;
    rightScore = 0;
    readonly maxScore = 5;
    leftPlayerName = ''
    rightPlayerName = ''
    leftPaddle!: Paddle;
    rightPaddle!: Paddle;
    ball!: Ball;

    constructor(readonly arena: Arena) {}

    init(leftPlayerName:string = 'left', rightPlayerName:string = 'right', isTournament = false): void {
        this.leftPlayerName = leftPlayerName;
        this.rightPlayerName = rightPlayerName;
        this.isTournament = isTournament;
        this.leftScore = 0;
        this.rightScore = 0;
        this.state = GameState.NEW_GAME;

        this.leftPaddle = new Paddle(0.5, this.arena, "d", "c");
        this.rightPaddle = new Paddle(this.arena.width - 0.5, this.arena, "j", "n");

        this.ball = new Ball(this.arena);
    }
}

export class GameView
{
    private scale = 1;
    private offsetX = 0;
    private offsetY = 0;

    constructor(private ctx: CanvasRenderingContext2D) {}

    resize(canvas: HTMLCanvasElement, model: GameModel): void {
        const { width, height } = model.arena;

        const scaleX = canvas.width / width;
        const scaleY = canvas.height / height;
        this.scale = Math.min(scaleX, scaleY);

        this.offsetX = (canvas.width - width * this.scale) / 2;
        this.offsetY = (canvas.height - height * this.scale) / 2;
    }

    render(model: GameModel): void {
        const ctx = this.ctx;
		const width = ctx.canvas.width;
		const height = ctx.canvas.height;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        ctx.fillStyle = "white";

        // paddles
        ctx.fillRect(
            model.leftPaddle.position.x,
            model.leftPaddle.position.y,
            model.leftPaddle.width,
            model.leftPaddle.height
        );

        ctx.fillRect(
            model.rightPaddle.position.x,
            model.rightPaddle.position.y,
            model.rightPaddle.width,
            model.rightPaddle.height
        );

        // ball
        ctx.beginPath();
        ctx.arc(
            model.ball.position.x,
            model.ball.position.y,
            model.ball.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();

        // UI (score, playersname) hors scaling
        ctx.fillStyle = "white";
        ctx.font = `${0.64 * this.scale}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(
            `${model.leftScore} : ${model.rightScore}`,
            width / 2,
            40
        );
        ctx.textAlign = 'left'
        ctx.fillText(model.leftPlayerName, 20, 40)
        ctx.textAlign = 'right'
        ctx.fillText(model.rightPlayerName, width - 20, 40)
        ctx.textAlign = 'center'
		switch (model.state)
		{
			case (GameState.NEW_GAME):
				ctx.fillText("ESPACE pour démarrer", width / 2, height / 2);
				break;
			case (GameState.PAUSED):
				ctx.fillText("PAUSE", width / 2, height / 2);
				break;
			case (GameState.GAME_OVER):
				ctx.fillText("FIN DE PARTIE", width / 2, height / 2 - (0.64 * this.scale));
				ctx.fillText("ESPACE pour rejouer", width / 2, height / 2);
				break;
			default:
		}
    }
}

export class GameController
{
    private keys = new Set<string>();
    private lastTime = 0;
    private onGameOver = ()=>{};
    private stop = false;

    constructor(
        private model: GameModel,
        private view: GameView
    ) {
        window.addEventListener("keydown", e => this.onKey(e, true));
        window.addEventListener("keyup", e => this.onKey(e, false));
    }

    start(time: number): void {
        if (this.stop) return;
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.update(dt);
        this.view.render(this.model);

        requestAnimationFrame(t => this.start(t));
    }

    private onKey(e: KeyboardEvent, down: boolean): void {
        const key = e.key.toLowerCase();

		if (key === " " && !down) {
			if (this.model.state === GameState.NEW_GAME) {
				this.model.state = GameState.PLAYING;
			} else if (this.model.state === GameState.GAME_OVER) {
				this.model.state = GameState.PLAYING;
				this.model.init();
			}
			else if (this.model.state === GameState.PLAYING) {
				this.model.state = GameState.PAUSED;
			} else if (this.model.state === GameState.PAUSED) {
				this.model.state = GameState.PLAYING;
			}
			return;
		}

        down ? this.keys.add(key) : this.keys.delete(key);
    }

    private update(dt: number): void {
        if (this.model.state !== GameState.PLAYING) return;

        const { leftPaddle, rightPaddle, ball } = this.model;

        leftPaddle.update(dt, this.keys);
        rightPaddle.update(dt, this.keys);
        ball.update(dt);

        this.handleCollisions();
    }

    public setGameOver(gameOver:()=>void)
    {
        this.onGameOver=gameOver
    }

    public getCurrentScore()
    {
        return [this.model.leftScore, this.model.rightScore]
    }
    private handleGameOver():void
    {
        this.model.state = GameState.GAME_OVER;
        this.stop = true;
        if (!this.model.isTournament) return;
        this.onGameOver()
    }

    private handleCollisions(): void {
        const ball = this.model.ball;

        const paddleHit = (p: any) =>
            ball.position.x - ball.radius < p.position.x + p.width &&
            ball.position.x + ball.radius > p.position.x &&
            ball.position.y > p.position.y &&
            ball.position.y < p.position.y + p.height;

        if (paddleHit(this.model.leftPaddle) || paddleHit(this.model.rightPaddle)) {
            ball.velocity.x *= -1;
        }

        if (ball.position.x < 0) {
            this.model.rightScore++;
            ball.reset(1);
			this.model.leftPaddle.init();
			this.model.rightPaddle.init();
            console.log('player1 missed the ball')
        }

        if (ball.position.x > this.model.arena.width) {
            this.model.leftScore++;
            ball.reset(-1);
			this.model.leftPaddle.init();
			this.model.rightPaddle.init();
            console.log('player2 missed the ball')
        }

        if (
            this.model.leftScore >= this.model.maxScore ||
            this.model.rightScore >= this.model.maxScore
        ) {
            this.handleGameOver()
        }
    }
}

const canvas = document.querySelector("#canvas2D") as HTMLCanvasElement
document.body.style.margin = "0";

const ctx = canvas.getContext("2d")!;
const arena = new Arena();
const model = new GameModel(arena);
model.init();
const view = new GameView(ctx);
const controller = new GameController(model, view);

function resize() {
    const w = Math.max(arena.minPixelWidth, window.innerWidth);
    const h = Math.max(arena.minPixelHeight, window.innerHeight);

    const targetRatio = 16 / 9;
    let width = w;
    let height = w / targetRatio;

    if (height > h) {
        height = h;
        width = h * targetRatio;
    }

    canvas.width = width / 2;
    canvas.height = height / 2;

    view.resize(canvas, model);
}

window.addEventListener("resize", resize);
resize();

requestAnimationFrame(t => controller.start(t));
