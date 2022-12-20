// создаем константы переменныъ

const canvas = document.querySelector('.myCanvas'); // забираю канвас из штмл
const myButton = document.querySelector('.collapse'); // кнопку которая делает анимацию 
const context = canvas.getContext('2d'); // контекст конваса


//Вспомогательный класс чтобы легче обрабатывать мышку
class Mouse {
    left
    pLeft
    isFirst

    constructor() {
        this.left = false;
        this.pLeft = false;
        this.isFirst = false;
    }
}




//Основной класс, в котором описывается вся логикка взаимодействия с канвасом
class CanvasModel {
    canvas
    context
    mouse = new Mouse()
    firstPoint = [0,0]
    lines = []

	// Конструктор класса. Добовляем канвас и контекст, вешаем события
    constructor(canvas, canvasContext) {
        this.canvas = canvas;
        this.context = canvasContext;
        this.addListeners();
        this.updateLines()
    }

	//Проходимся по массиву линий и для каждой линии вызываем метод который  делает  анимацию.
	collapse() {
        this.lines.forEach(line => {
            this.collapseAnimation(line)
        })
    }
	
	//Каждую секунду сжимает отрезок.
    collapseAnimation(line) {

        const k = ((line.y2 - line.y1) / (line.x2 - line.x1));
        const middleX = Number(((line.x2 + line.x1) / 2).toFixed(0));
        const tick = () => {
            const animation = requestAnimationFrame(tick)
            this.clear();

            if (line.x1 > line.x2) {
                const preX1 = line.x1;
                const preY1 = line.y1;
                line.x1 = line.x2;
                line.x2 = preX1
                line.y1 = line.y2;
                line.y2 = preY1
            }

            if (line.x1 !== middleX) {
                line.x1 += 1;
                line.y1 += k;
            }
            if(line.x2 !== middleX) {
                line.x2 -= 1;
                line.y2 -= k;
            }

            this.updateLines();
            this.getIntersection()

            if (line.x1 === middleX && line.x2 === middleX) {
                this.lines = this.lines.filter(el => el !== line)
                cancelAnimationFrame(animation)
            }
        }
        tick()
    }

	//метод добавления событий
    addListeners() {
        this.canvas.onmouseup = this.onMouseUp.bind(this);
        this.canvas.onmousedown = this.onMouseDown.bind(this);
        this.canvas.onmousemove = this.onMouseMove.bind(this);
    }

	//обрабатывает события отжатия мышки
    onMouseUp(e) {
		
        if (e.button === 0) {
            this.mouse.pLeft = this.mouse.left;
            this.mouse.left = false;
        }
    }

	//обрабатывает события нажатия мышки
    onMouseDown(e) {

		if (e.button == 0 ) {
			this.mouse.pLeft = false;
			this.mouse.left = true;
		}

		if ( e.button == 2) {
			this.clear();
            this.updateLines();
            this.getIntersection();
            this.firstPoint = [];
		}

        this.mouse.isFirst = !this.mouse.isFirst;

        if (this.mouse.isFirst && this.mouse.left) {
            this.firstPoint = [e.pageX - e.target.offsetLeft, e.pageY - e.target.offsetTop]
        } else {
            const line = {
                x1: this.firstPoint[0],
                y1: this.firstPoint[1],
                x2: e.pageX - e.target.offsetLeft,
                y2: e.pageY - e.target.offsetTop
            }
            this.lines.push(line)
            this.firstPoint = [];
        }
    }
	
	//обрабатывает события передвижения мышки
	onMouseMove(e) {

        if(this.mouse.pLeft && this.mouse.isFirst) {
            this.clear();
            this.updateLines();
            this.drawLine(
                this.firstPoint[0],
                this.firstPoint[1],
                e.pageX - e.target.offsetLeft,
                e.pageY - e.target.offsetTop
            );

            const line = {
                x1: this.firstPoint[0],
                y1: this.firstPoint[1],
                x2: e.pageX - e.target.offsetLeft,
                y2: e.pageY - e.target.offsetTop
            }
            this.lines.push(line)
            this.getIntersection();
            this.lines.pop()
        }

    }

	// метод перересовки всех линий
	updateLines() {
        for (let i = 0; i < this.lines.length; i++) {
            this.drawLine(this.lines[i].x1,
                this.lines[i].y1,
                this.lines[i].x2,
                this.lines[i].y2
            );
        }
    }

	//метод нахождения точек пересечения
	getIntersection() {
        for (let i = 0; i < this.lines.length; i++) {
            const line1 = this.lines[i];

            for (let j = i + 1; j < this.lines.length; j++) {
                const line2 = this.lines[j];

                const k1 = (line1.y2 - line1.y1) / (line1.x2 - line1.x1);
                const k2 = (line2.y2 - line2.y1) / (line2.x2 - line2.x1);
                if (k1 === k2) return;

                const b1 = line1.y1 - k1 * line1.x1;
                const b2 = line2.y1 - k2 * line2.x1;

                const x = (b2-b1)/(k1-k2);
                const y = (k1 * (b2 - b1) / (k1 - k2)) + b1;

                const firstCondition = (x < line1.x2  && line1.x1 < x) || (x < line1.x1  && line1.x2 < x);
                const secondCondition = (x < line2.x2  && line2.x1 < x) || (x < line2.x1  && line2.x2 < x);

                if( firstCondition && secondCondition ) {
                    this.drawIntersection(x, y);
                }
            }
        }

    }

	//рисует точку 
    drawIntersection(x, y) {
        this.context.beginPath();
        this.context.fillStyle = 'red';
        this.context.arc(x, y, 4, 0, Math.PI * 2)
        this.context.fill();
        this.context.stroke();
        this.context.closePath();
    }

	//рисет линию 
    drawLine(startX, startY, endX, endY) {
        this.context.beginPath();
        this.context.moveTo(startX, startY);
        this.context.lineTo(endX, endY);
        this.context.stroke()
        this.context.closePath();
    }
	
	//очсистка канваса
	clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

}

//Мы создаем объект с класса в  котором описана вся функциональность  конваса
const myCanvas = new CanvasModel(canvas, context);

//Мы для кнопки добавляем событие клик.
myButton.addEventListener('click', () => myCanvas.collapse())
