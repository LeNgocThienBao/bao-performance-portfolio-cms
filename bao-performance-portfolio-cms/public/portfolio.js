
(async () => {

  // UPDATE TEXT CONTENT

  const set = (id, value) => {
    const el = document.getElementById(id);

    if (el && typeof value === "string") {
      el.textContent = value;
    }
  };

  // VALIDATE IMAGE URL

  const validImageUrl = value => {
    return typeof value === "string" &&
      /^\/api\/media\/[a-zA-Z0-9_-]+\.(jpg|png|webp|gif)$/
        .test(value);
  };

  // UPDATE PROJECT IMAGE

  const setProjectImage = (index, project) => {

    const title = document.getElementById(
      `project${index + 1}Title`
    );

    if (!title) return;

    const card = title.closest(".work-card");

    if (!card) return;

    const visual = card.querySelector(".work-visual");

    if (!visual) return;

    // Remove previous image if available

    visual.querySelectorAll(".project-image")
      .forEach(img => img.remove());

    visual.classList.remove("has-image");

    // Original visual elements

    const originalElements = [
      ...visual.children
    ];

    originalElements.forEach(el => {
      el.style.removeProperty("display");
    });

    // Keep original design if no image exists

    if (!validImageUrl(project.image)) return;

    const image = document.createElement("img");

    image.className = "project-image";

    image.alt =
      project.title || `Portfolio project ${index + 1}`;

    image.loading = "lazy";
    image.decoding = "async";

    // Display uploaded image after successful loading

    image.addEventListener("load", () => {

      originalElements.forEach(el => {
        el.style.display = "none";
      });

      visual.classList.add("has-image");

      image.style.zIndex = "2";

    });

    // Restore original design if image cannot load

    image.addEventListener("error", () => {

      image.remove();

      visual.classList.remove("has-image");

      originalElements.forEach(el => {
        el.style.removeProperty("display");
      });

    });

    visual.prepend(image);

    image.src = project.image;

  };

  // LOAD CMS CONTENT

  try {

    const response = await fetch(
      "/api/content",
      {
        cache: "no-store"
      }
    );

    if (!response.ok) return;

    const data = await response.json();

    // Personal information

    set("brandName", data.name);
    set("footerName", data.name);
    set("heroKicker", data.heroKicker);
    set("heroLead", data.heroLead);
    set("jobTitle", data.jobTitle);
    set("experienceMeta", data.experienceMeta);
    set("locationMeta", data.locationMeta);

    // Project content and images

    (data.projects || []).forEach((project, index) => {

      set(
        `project${index + 1}Title`,
        project.title
      );

      set(
        `project${index + 1}Desc`,
        project.description
      );

      if (typeof project.meta === "string") {

        set(
          `project${index + 1}Meta`,
          project.meta
        );

      }

      setProjectImage(index, project);

    });

  } catch (error) {

    // Keep original static content visible
    // if the CMS is temporarily unavailable.

    console.warn(
      "Portfolio CMS:",
      error.message
    );

  }

})();
