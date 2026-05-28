const DEFAULT_CLOUDINARY_CLOUD_NAME = "dzzflhq79";
const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUDINARY_CLOUD_NAME;
const SOBI_ASSET_BASE_URL =
  process.env.NEXT_PUBLIC_SOBI_ASSET_BASE_URL ||
  `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

function sobiAsset(path: string) {
  return `${SOBI_ASSET_BASE_URL}/${path}`;
}

export const SOBI_ASSETS = {
  // Default floating Sobi for backgrounds, avatars, and the landing page.
  DEFAULT: sobiAsset("v1778706261/image_tyr7o1.png"),
  
  // Waving Sobi for login, register, and chat cards.
  WAVING: sobiAsset("v1778876222/sobi_robot_qusvll.png"),
  
  // Trophy Sobi for high-score celebrations.
  TROPHY: sobiAsset("v1778876221/sobi_trophy_wufrct.png"),
  
  // Teacher Sobi for material and summary screens.
  TEACHER: sobiAsset("v1778876221/sobi_teacher_swocij.png"),
  
  // Magnifier Sobi for empty search/history states.
  MAGNIFIER: sobiAsset("v1778874807/sobi_robot_magnifier_yeiunh.png"),
  
  // Sad Sobi for error states and 404.
  SAD: sobiAsset("v1778874805/sobi_robot_sad_rdj9fw.png"),

  // Calendar Sobi for the study schedule page.
  CALENDAR: sobiAsset("v1778952693/sobi_calendar_clock_ldtyjo.png"),

  // Idea Sobi for the explanation page.
  IDEA: sobiAsset("v1778952692/sobi_idea_ijlrj6.png"),
};
