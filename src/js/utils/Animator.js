class Animator {
  constructor(element) {
    this.element = element;
  }
  toggleDropdown(closedHeight, openedHeight, duration, isOpen) {
    console.log(closedHeight, openedHeight, duration, isOpen, this.element);
    let start;
    this.element.style.padding = isOpen ? 0 : '40px';
    const animate = timestamp => {
      if(!start) start = timestamp;
      const progress = timestamp - start;
      const percentOfDuration = (progress / duration).toFixed(2);
      const slideUp = Math.max(openedHeight - openedHeight * percentOfDuration, closedHeight);
      const slideDown = Math.min(openedHeight * percentOfDuration, openedHeight);
      this.element.style.height = (isOpen ? slideUp : slideDown) + "px";
      if(duration * percentOfDuration < duration) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }
}