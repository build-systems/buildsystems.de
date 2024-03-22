function buildCarousel () {
  const buttons = document.querySelectorAll("[data-carousel-button]")!;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button instanceof HTMLElement) {
        const offset = button.dataset!.carouselButton === "next" ? 1 : -1;
        const slides = button.closest("[data-carousel]")!.querySelector("[data-slides]");
        if (slides != undefined) {
          const activeSlide = slides.querySelector("[data-active]");
          if (activeSlide != undefined) {
            let newIndex = [...slides.children].indexOf(activeSlide) + offset;
            if (newIndex < 0) newIndex = slides.children.length - 1;
            if (newIndex >= slides.children.length) newIndex = 0;
            // Change active slide
            const newSlide = slides.children[newIndex] as HTMLElement; 
            newSlide.dataset.active = "true";
            delete (activeSlide as HTMLElement).dataset.active;
            // Remove styles
            const activeMiddleCarousel = activeSlide.querySelector("h3")?.querySelector(".middle")! as HTMLElement;
            const activeBottomCarousel = activeSlide.querySelector("h3")?.querySelector(".middle")! as HTMLElement;
            activeMiddleCarousel.style.transform = "";
            activeMiddleCarousel.style.animation = "";
            activeBottomCarousel.style.animation = "";
            // Add styles
            const newMiddleCarousel = newSlide.querySelector("h3")?.querySelector(".middle")! as HTMLElement;
            const newBottomCarousel = newSlide.querySelector("h3")?.querySelector(".bottom")! as HTMLElement;
            console.log(newMiddleCarousel);
            newMiddleCarousel.style.transform = "translateY(-100%)";
            newMiddleCarousel.style.animation = "change-middle 0.2s ease-in forwards";
            newBottomCarousel.style.animation = "change-bottom 0.2s ease-in forwards";
          }
        }
      }
    });
  });
  
  var nextButton = document.querySelector(".next") as HTMLElement;
  var carouselTop = document.querySelector(".top") as HTMLElement;
  var carouselMiddle = document.querySelector(".middle") as HTMLElement;
  
  // Animation function
  async function animateOnce() {
    try {
      carouselTop.style.animation = "top-animation 1.8s ease-in-out forwards";
      carouselMiddle.style.animation = "middle-animation 1.8s ease-in-out forwards";
      setTimeout(() => {
        // nextButton.removeEventListener("mouseenter", animateOnce);
        carouselTop.style.animation = "";
        carouselMiddle.style.animation = "";
      }, 1800);
    } catch (e) {
      console.error("e", e);
    }
  }
  
  // Options to use on the IntersectionObserver
  const options = {
    root: null,
    rootMargin: '0px', // Offset
    threshold: 1 // 1 means when 100% of the caroulse is visible
  };
  
  // Observer to activate animation when carousel is on view
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateOnce();
        observer.unobserve(entry.target); // Unobserve the target once it's in view
      }
    });
  }, options);
  
  // Start observing the carousel
  const carouselElement = document.querySelector('.carousel-container') as HTMLElement;
  observer.observe(carouselElement);
}

buildCarousel();
document.addEventListener("astro:beforeload", buildCarousel);