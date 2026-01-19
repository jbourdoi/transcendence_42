enum GameState
{
    NEW_GAME,   //0
    PLAYING,    //1
    PAUSED,     //2
    GAME_OVER   //3
}

const GameStateStr = [ "NEW_GAME", "PLAYING", "PAUSED", "GAME_OVER"]

class Arena
{
    // Dimensions logiques (ratio 16/9)
    readonly width = 16;
    readonly height = 9;

    // Contraintes d'affichage
    readonly minPixelWidth = 640;
    readonly minPixelHeight = 360;

    // Proportions
    readonly paddleHeightRatio = 0.25;   // 25% de la hauteur
    readonly paddleWidthRatio = 0.015;   // largeur relative
    readonly ballRadiusRatio = 0.015;    // proportion de la largeur
    readonly paddleSpeedRatio = 1.2;     // hauteur / seconde
    readonly ballSpeedRatio = 0.2;
}

class Vector2
{
    constructor(public x: number, public y: number) {}

    add(v: Vector2): void {
        this.x += v.x;
        this.y += v.y;
    }
}

class Paddle
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
        this.position = new Vector2(this.x, (this.arena.height - this.height) / 2);
	}

    update(dt: number, input: Set<string>): void
    {
        if (input.has(this.upKey)) this.position.y -= this.speed * dt;
        if (input.has(this.downKey)) this.position.y += this.speed * dt;

        this.position.y = Math.max(0, Math.min(this.arena.height - this.height, this.position.y)
        );
    }
}

class Ball
{
    readonly radius: number;
    position: Vector2;
    velocity: Vector2;
    speed: number;

    constructor(readonly arena: Arena)
    {
        this.radius = arena.width * arena.ballRadiusRatio;
        this.position = new Vector2(arena.width / 2, arena.height / 2);
        this.velocity = new Vector2(arena.width * 0.5, arena.height * 0.3);
        this.speed = arena.height * arena.ballSpeedRatio;
    }

    reset(direction: number): void
    {
        this.position.x = this.arena.width / 2;
        this.position.y = this.arena.height / 2;
        this.velocity.x = direction * this.arena.width * 0.5;
        this.velocity.y = (Math.random() - 0.5) * this.arena.height * 0.6;
    }

    update(dt: number): void
    {
        const delta = dt * this.speed
        this.position.add(new Vector2(
            this.velocity.x * delta,
            this.velocity.y * delta
        ));
    }
}

export class GameModel
{
    state = GameState.NEW_GAME;
	arena : Arena;
    isTournament: boolean = false;
    leftScore = 0;
    rightScore = 0;
    readonly maxScore = 5;
    leftPlayerName = ''
    rightPlayerName = ''
    leftPaddle!: Paddle;
    rightPaddle!: Paddle;
    ball!: Ball;

    constructor()
	{
		this.arena = new Arena()
	}

    init(leftPlayerName:string = 'left', rightPlayerName:string = 'right', isTournament = false): void
    {
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
	private arena : Arena;
    private offsetX = 0;
    private offsetY = 0;
    private ctx : CanvasRenderingContext2D

    constructor(private canvas: HTMLCanvasElement)
    {
        this.ctx = canvas.getContext('2d')!
		this.arena = new Arena()
    }

    resize(): void
    {
        const w = Math.max(this.arena.minPixelWidth, window.innerWidth);
        const h = Math.max(this.arena.minPixelHeight, window.innerHeight);

        const targetRatio = 16 / 9;
        let widthScreen = w;
        let heightScreen = w / targetRatio;

        if (heightScreen > h) {
            heightScreen = h;
            widthScreen = h * targetRatio;
        }

        this.canvas.width = widthScreen * 0.9;
        this.canvas.height = heightScreen * 0.9;
        const { width, height } = this.arena;

        const scaleX = this.canvas.width / width;
        const scaleY = this.canvas.height / height;
        this.scale = Math.min(scaleX, scaleY);

        this.offsetX = (this.canvas.width - width * this.scale) / 2;
        this.offsetY = (this.canvas.height - height * this.scale) / 2;
    }

    render(model: GameModel): void
    {
        const ctx = this.ctx;
		const width = ctx.canvas.width;
		const height = ctx.canvas.height;

        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = "white";
        // UI (score, playersname) hors scaling
        const scaleFont = 0.64 * this.scale;
        const leftKeyPos = model.leftPaddle.position.x + model.leftPaddle.width + scaleFont;
        const rightKeyPos = width - leftKeyPos;
        const topKeyPos = 2 * scaleFont;
        ctx.font = `${scaleFont}px Arial`;
        ctx.textAlign = 'left'
        ctx.fillText(model.leftPaddle.upKey, leftKeyPos, topKeyPos)
        ctx.fillText(model.leftPaddle.downKey, leftKeyPos, height - topKeyPos)
        ctx.fillText(model.leftPlayerName.slice(0, 10), topKeyPos, topKeyPos)
        ctx.textAlign = 'right'
        ctx.fillText(model.rightPaddle.upKey, rightKeyPos, topKeyPos)
        ctx.fillText(model.rightPaddle.downKey, rightKeyPos, height - topKeyPos)
        ctx.fillText(model.rightPlayerName.slice(0, 10), width - topKeyPos, topKeyPos)
        ctx.textAlign = 'center'
        ctx.fillText(`${model.leftScore} : ${model.rightScore}`, width * 0.5, topKeyPos);
		switch (model.state)
		{
            case (GameState.NEW_GAME):
                ctx.fillText("ESPACE pour démarrer", width * 0.5, height * 0.5 + 0.8 * this.scale);
                break;
            case (GameState.PAUSED):
                ctx.fillText("PAUSE", width * 0.5, height * 0.5 + 0.8 * this.scale);
                break;
            case (GameState.GAME_OVER):
                ctx.fillText("FIN DE PARTIE", width * 0.5, height * 0.5 + 0.8 * this.scale);
                ctx.fillText("ESPACE pour rejouer", width * 0.5, height * 0.5 + 1.6 * this.scale);
                break;
            default:
		}

        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);
        ctx.fillStyle = "white";
              // paddles
        ctx.fillRect(
            model.leftPaddle.position.x - model.leftPaddle.width,
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
    }
}

export class GameController
{
    private keys = new Set<string>();
    private lastTime = 0;
    private onGameOver = ()=>{};
    private intervalId : number = 0;

    constructor(
        private model: GameModel,
        private view: GameView
    ) {
        window.addEventListener("keydown", e => this.onKey(e, true));
        window.addEventListener("keyup", e => this.onKey(e, false));
    }

    cleanup() : void
    {
        if (this.intervalId !== 0)
        {
            console.log('clearInterval with gamestate: ', GameStateStr[this.model.state]);
            clearInterval(this.intervalId);
            this.intervalId = 0;
        }
    }

    start(): void
    {
        this.cleanup();
        const hertz = 1/ 60
        this.intervalId = setInterval(()=>{
            this.update(hertz);
            this.view.render(this.model);
        },  1000 * hertz)
    }

    private onKey(e: KeyboardEvent, down: boolean): void
    {
        const key = e.key.toLowerCase();

		if (key === " " && !down) {
			if (this.model.state === GameState.NEW_GAME)
            {
				this.model.state = GameState.PLAYING;
                this.start()
			}
            else if (this.model.state === GameState.GAME_OVER)
            {
				this.model.state = GameState.PLAYING;
				this.model.init();
                this.start()
			}
			else if (this.model.state === GameState.PLAYING)
            {
				this.model.state = GameState.PAUSED;
			}
            else if (this.model.state === GameState.PAUSED)
            {
				this.model.state = GameState.PLAYING;
			}
			return;
		}

        down ? this.keys.add(key) : this.keys.delete(key);
    }

    private update(dt: number): void
    {
        if (this.model.state !== GameState.PLAYING) return;

        const { leftPaddle, rightPaddle, ball } = this.model;

        leftPaddle.update(dt, this.keys);
        rightPaddle.update(dt, this.keys);
        ball.update(dt);

        this.handleCollisions();
        this.checkGameOver();
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
        this.cleanup()
        this.onGameOver()
    }

    private checkGameOver(): void
    {
        if (
            this.model.leftScore >= this.model.maxScore ||
            this.model.rightScore >= this.model.maxScore
        ) {
            this.handleGameOver()
        }
    }

    private handleCollisions(): void
    {
        const ball = this.model.ball;
        const leftPaddle = this.model.leftPaddle;
        const rightPaddle = this.model.rightPaddle;

        if (ball.position.y - ball.radius < 0)
        {
            ball.position.y = ball.radius;
            ball.velocity.y *= -1;
        }
        else if (ball.position.y + ball.radius > ball.arena.height)
        {
            ball.position.y = ball.arena.height - ball.radius;
            ball.velocity.y *= -1;
        }
        if (ball.position.x < leftPaddle.x + ball.radius)
        {
            if (ball.position.y > leftPaddle.position.y && ball.position.y < leftPaddle.position.y + leftPaddle.height)
            {
                ball.position.x = leftPaddle.x + ball.radius;
                ball.velocity.x *= -1;
                return;
            }
            else
            {
                this.model.rightScore++;
                leftPaddle.init();
                rightPaddle.init();
                ball.reset(1);
                return;
            }
        }
        else if (ball.position.x > rightPaddle.x - ball.radius)
        {
            if (ball.position.y > rightPaddle.position.y && ball.position.y < rightPaddle.position.y + rightPaddle.height)
            {
                ball.position.x = rightPaddle.x - ball.radius;
                ball.velocity.x *= -1;
                return;
            }
            else
            {
                this.model.leftScore++;
                leftPaddle.init();
                rightPaddle.init();
                ball.reset(-1);
                return;
            }
        }
    }
}
