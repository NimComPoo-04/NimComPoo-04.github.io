// Shit generated using GPT, I don't like to do UI

const AstheticsForLabels = {
  302: {
    label: "Car Horn",
    icon: "fa-car"
  },

  303: {
    label: "Horn",
    icon: "fa-bullhorn"
  },

  312: {
    label: "Truck Horn",
    icon: "fa-truck"
  },

  325: {
    label: "Train Horn",
    icon: "fa-train"
  },

  324: {
    label: "Train Whistle",
    icon: "fa-train"
  },

  390: {
    label: "Siren",
    icon: "fa-triangle-exclamation"
  },

  317: {
    label: "Police",
    icon: "fa-shield-halved"
  },

  318: {
    label: "Ambulance",
    icon: "fa-ambulance"
  },

  319: {
    label: "Fire Truck",
    icon: "fa-fire-extinguisher"
  },

  391: {
    label: "Warning Siren",
    icon: "fa-tower-broadcast"
  },

  304: {
    label: "Car Alarm",
    icon: "fa-car-on"
  },

  392: {
    label: "Buzzer",
    icon: "fa-bell"
  },

  313: {
    label: "Reverse Beep",
    icon: "fa-rotate-left"
  },

  450: {
    label: "Clock",
    icon: "fa-clock"
  },

  195: {
    label: "Bell",
    icon: "fa-bell"
  },

  198: {
    label: "Bike Bell",
    icon: "fa-bicycle"
  },

  321: {
    label: "Traffic",
    icon: "fa-road"
  },

  316: {
    label: "Emergency Vehicle",
    icon: "fa-truck-medical"
  },

  default: {
    label: "Sound",
    icon: "fa-volume-high"
  }
};

function getChipColors(probability) {
  if (probability >= 0.9) {
    return {
      fg: "#166534",
      bg: "#DCFCE7"
    };
  }

  if (probability >= 0.75) {
    return {
      fg: "#15803D",
      bg: "#DCFCE7"
    };
  }

  if (probability >= 0.5) {
    return {
      fg: "#92400E",
      bg: "#FEF3C7"
    };
  }

  if (probability >= 0.25) {
    return {
      fg: "#B45309",
      bg: "#FFEDD5"
    };
  }

  return {
    fg: "#64748B",
    bg: "#F1F5F9"
  };
}
