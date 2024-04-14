module.exports = {
  docs: [
    "overview",
    "installation",
    "getting_started",
    "entities",
    "timers",
    "deployment",
    {
      type: "category",
      label: "Advanced",
      collapsed: false,
      items: ["development", "custom_task", "architecture"],
    },
    {
      type: "category",
      label: "Tasks",
      collapsed: false,
      items: ["tasks/openvimo"],
    },
  ],
}
