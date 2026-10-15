// The function is wrapped on a function to work with Astro view transitions
function init() {
  document
    .querySelectorAll<HTMLElement>(".container-blog-carousel")
    .forEach(initCarousel);
}

// Each carousel is wired up separately so pages can hold several of them
function initCarousel(container: HTMLElement) {
  const slider = container.querySelector(".blog-carousel") as HTMLElement;
  if (slider) {
    const allLinks: NodeListOf<HTMLElement> =
      slider.querySelectorAll(".card-link");

    // Previous
    const buttonPrevious = container.querySelector(
      ".btn-prev",
    ) as HTMLButtonElement;
    const scrollLeftHandler = () => {
      slider.scrollBy(-400, 0);
    };
    buttonPrevious.addEventListener("click", scrollLeftHandler);

    // Next
    const buttonNext = container.querySelector(".btn-next") as HTMLButtonElement;
    const scrollRightHandler = () => {
      slider.scrollBy(400, 0);
    };
    buttonNext.addEventListener("click", scrollRightHandler);

    // Hide the arrows when there is nothing more to scroll in that direction
    // (1px tolerance for fractional scroll positions)
    const updateButtons = () => {
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      buttonPrevious.disabled = slider.scrollLeft <= 1;
      buttonNext.disabled = slider.scrollLeft >= maxScroll - 1;
    };
    slider.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    updateButtons();

    // Mouse click and drag to scroll
    // Variables to store mouse position
    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    // Function to handle mouse enter event
    function onMouseEnter(event: any) {
      // Add event listeners for mouse down and up
      slider.addEventListener("mousedown", onMouseDown);
      slider.addEventListener("mouseup", onMouseUp);
    }
    slider.addEventListener("mouseenter", onMouseEnter);

    // Function to handle mouse down event
    function onMouseDown(e: MouseEvent) {
      slider.style.scrollSnapType = "none";
      slider.style.scrollBehavior = "auto";
      isDown = true;
      slider.classList.add("active");
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
      cancelMomentumTracking();
      slider.addEventListener("mousemove", onMouseMove);
    }

    // Function to handle mouse move event
    function onMouseMove(e: MouseEvent) {
      allLinks.forEach((element: HTMLElement) => {
        element.style.cursor = "grabbing";
        element.style.pointerEvents = "none";
      });
      setTimeout(function () {
        allLinks.forEach((element: HTMLElement) => {
          element.style.pointerEvents = "auto";
        });
      }, 100);
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      var prevScrollLeft = slider.scrollLeft;
      slider.scrollLeft = scrollLeft - walk;
      velX = slider.scrollLeft - prevScrollLeft;
    }

    // Function to handle mouse up event
    function onMouseUp(e: MouseEvent) {
      isDown = false;
      slider.classList.remove("active");
      beginMomentumTracking();
      setTimeout(function () {
        slider.style.scrollSnapType = "x mandatory";
        slider.style.scrollBehavior = "smooth";
        allLinks.forEach((element: HTMLElement) => {
          element.style.cursor = "pointer";
        });
      }, 1000);
      slider.removeEventListener("mousemove", onMouseMove);
    }

    // Function to handle mouse leave event
    function onMouseLeave() {
      isDown = false;
      slider.classList.remove("active");
    }
    // Add event listener for mouse leave
    slider.addEventListener("mouseleave", onMouseLeave);

    // Momentum
    var velX = 0;
    var momentumID: number;

    // Function to handle wheel event
    function onWheelEvent(event: any) {
      cancelMomentumTracking();
    }
    // Add event listener for wheel event
    slider.addEventListener("wheel", onWheelEvent);

    function beginMomentumTracking() {
      cancelMomentumTracking();
      momentumID = requestAnimationFrame(momentumLoop);
    }
    function cancelMomentumTracking() {
      cancelAnimationFrame(momentumID);
    }
    function momentumLoop() {
      slider.scrollLeft += velX;
      velX *= 0.95;
      if (Math.abs(velX) > 0.5) {
        momentumID = requestAnimationFrame(momentumLoop);
      }
    }

    // Clean up by destroying instances and removing event listeners
    document.addEventListener(
      "astro:before-swap",
      () => {
        buttonPrevious.removeEventListener("click", scrollLeftHandler);
        buttonNext.removeEventListener("click", scrollRightHandler);
        slider.removeEventListener("scroll", updateButtons);
        window.removeEventListener("resize", updateButtons);
        slider.removeEventListener("mouseenter", onMouseEnter);
        slider.removeEventListener("mouseleave", onMouseLeave);
        slider.removeEventListener("wheel", onWheelEvent);
      },
      { once: true }
    );
  }
}

// Initialize on first load
init();

// Re-initialize after swapping pages
document.addEventListener("astro:page-load", init);
