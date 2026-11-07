class StartP {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.element = null;
        this.cityImg = null;
        this.animesImg = null;
    }

    start() {
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.zIndex = '50';
        this.element.style.overflow = 'hidden';
        this.element.style.display = 'flex';
        this.element.style.justifyContent = 'center';
        this.element.style.alignItems = 'center';
        this.element.style.background = '#000';

        this.cityImg = document.createElement('img');
        this.cityImg.src = 'city.png';
        this.cityImg.style.position = 'absolute';
        this.cityImg.style.width = '100%';
        this.cityImg.style.height = '100%';
        this.cityImg.style.objectFit = 'cover';
        this.cityImg.style.transform = 'scale(1)';
        this.cityImg.style.transition = 'transform 2s ease-out';
        this.element.appendChild(this.cityImg);

        this.animesImg = document.createElement('img');
        this.animesImg.src = 'animes.png';
        this.animesImg.style.position = 'absolute';
        this.animesImg.style.width = '500px';
        this.animesImg.style.height = '500px';
        this.animesImg.style.objectFit = 'contain';
        this.animesImg.style.transform = 'scale(0)';
        this.animesImg.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
        this.element.appendChild(this.animesImg);

        this.container.appendChild(this.element);

        setTimeout(() => {
            this.cityImg.style.transform = 'scale(1.2)';
        }, 50);

        setTimeout(() => {
            this.animesImg.style.transform = 'scale(1)';
        }, 500);

        setTimeout(() => {
            this.destroy();
            if (this.onComplete) {
                this.onComplete();
            }
        }, 1500);
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
