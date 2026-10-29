export const EQUIPMENT = 'robotic-double-disc';
export const TOUR = ['machine', 'robot', 'loading', 'grinding', 'ring', 'process', 'requirements', 'next'];
export const NODES = {
  machine: {
    name: 'The complete system', short: 'Complete system', parent: null, kind: 'machine', target: 'machine',
    kicker: '30-INCH DOUBLE-DISC GRINDER', title: 'See the complete system.',
    intro: 'Explore the grinder, robot, transfer area and operator interface.',
    heading: 'Built around the application',
    body: 'Choose a component, or follow the guided tour from the complete system to ring gear face grinding.',
    note: 'Exterior interpreted from C&B’s published equipment photo. Geometry and scale are illustrative.',
    next: 'robot', nextLabel: 'Explore robotic handling'
  },
  robot: {
    name: 'Robotic handling', short: 'Robot', parent: 'machine', kind: 'machine', target: 'robot',
    kicker: 'HANDLING THE PART', title: 'From handling to grinding.',
    intro: 'See where the robot connects the part with the grinding system.',
    heading: 'Start with the handling needs',
    body: 'Part shape, orientation and production needs help define the tooling and loading approach.',
    note: 'Photo-guided exterior. Robot tooling and movement require application-specific review.',
    next: 'loading', nextLabel: 'See the transfer area'
  },
  loading: {
    name: 'Part transfer', short: 'Part transfer', parent: 'machine', kind: 'machine', target: 'loading',
    kicker: 'BETWEEN OPERATIONS', title: 'Present the part.',
    intro: 'The transfer area links robotic handling with the grinding operation.',
    heading: 'Geometry comes before a fixture',
    body: 'Discuss how parts arrive, where they locate and how they move on. Fixture details here are schematic.',
    note: 'Transfer-area interpretation. Fixture details and part locations are schematic.',
    next: 'grinding', nextLabel: 'Enter the grinding zone'
  },
  grinding: {
    name: 'Grinding zone', short: 'Grinding zone', parent: 'machine', kind: 'machine', target: 'grinding',
    kicker: 'INSIDE THE PROCESS', title: 'Inside the grinding zone.',
    intro: 'Open the illustrative interior to see the relationship between a workpiece and two grinding faces.',
    heading: 'A principle, made visible',
    body: 'Opposing wheel faces remove material from the part’s two sides. Review the actual arrangement with engineering.',
    note: 'Process schematic. Internal arrangement, workholding and wheel geometry are illustrative.',
    next: 'ring', nextLabel: 'Explore a ring gear'
  },
  controls: {
    name: 'Operator interface', short: 'Operator interface', parent: 'machine', kind: 'machine', target: 'controls',
    kicker: 'THE OPERATOR’S VIEW', title: 'The operator’s connection.',
    intro: 'Explore the operator panel’s place in the complete system.',
    heading: 'Discuss the working context',
    body: 'Bring your team’s setup, operation and changeover needs into the conversation.',
    note: 'Photo-guided operator-panel exterior. Screen content is illustrative.',
    next: 'grinding', nextLabel: 'Explore the grinding zone'
  },
  ring: {
    name: 'Ring gear', short: 'Ring gear', parent: 'grinding', kind: 'ring', target: 'part',
    kicker: 'YOUR APPLICATION', title: 'Two faces. One application.',
    intro: 'Select either annular face to see the surface under discussion.',
    heading: 'Opposing faces', body: 'Select a face to see the surface under discussion. This illustrative part has no preset customer dimensions or tolerances.',
    note: 'Application illustration. This representative machine is not identified as the published ring-gear case machine.',
    options: [['both', 'Both faces'], ['upper', 'Face A'], ['lower', 'Face B']],
    next: 'process', nextLabel: 'See the grinding relationship'
  },
  process: {
    name: 'Grinding sequence', short: 'Grinding sequence', parent: 'ring', kind: 'ring', target: 'process',
    kicker: 'THE PROCESS RELATIONSHIP', title: 'Follow the grinding sequence.',
    intro: 'Step through loading, face grinding and unloading as connected parts of an application.',
    heading: 'Work on the opposing faces', body: 'Two grinding faces act on opposing surfaces. This sequence explains their relationship, not a machine cycle or robot trajectory.',
    note: 'Process schematic. Position, movement and wheel spacing are illustrative; no cycle time is implied.',
    options: [['load', 'Loading'], ['grind', 'Face grinding'], ['unload', 'Unloading']],
    next: 'requirements', nextLabel: 'Explore the requirements'
  },
  requirements: {
    name: 'Your requirements', short: 'Requirements', parent: 'ring', kind: 'ring', target: 'requirements',
    kicker: 'DEFINE THE DISCUSSION', title: 'Define your requirements.',
    intro: 'Explore the details that help C&B understand your part and process.',
    heading: 'Outside diameter', body: 'Share the outside diameter and the geometry of your part. A drawing adds context that a single dimension cannot.',
    note: 'Illustrative geometry. The dimensions shown have no values and do not define a machine’s capacity.',
    options: [['diameter', 'Diameter'], ['thickness', 'Thickness'], ['finish', 'Finish & precision'], ['production', 'Production']],
    next: 'next', nextLabel: 'Prepare your request'
  },
  next: {
    name: 'Your next step', short: 'Your next step', parent: 'ring', kind: 'ring', target: 'next',
    kicker: 'YOUR ENGINEERING CONVERSATION', title: 'Bring the knowns. And the questions.',
    intro: 'Start a quote request with the details you have. Open questions are a useful part of the brief.',
    heading: 'A useful starting brief', body: '',
    note: 'Exploring a component does not confirm a specification or select a machine for your application.'
  }
};

export const DETAILS = {
  ring: {
    both: ['Opposing faces', 'The two broad annular surfaces are the focus of this application. Select either face to take a closer look.'],
    upper: ['Face A', 'One of the two opposing faces. Share the finished surface requirements shown on your drawing.'],
    lower: ['Face B', 'The opposite face. Finished thickness describes the distance between these two surfaces.']
  },
  process: {
    load: ['Present the part', 'The loading approach depends on part geometry, orientation and production needs. This position is illustrative.'],
    grind: ['Work on the opposing faces', 'The faces of two grinding wheels remove material from opposing part surfaces. This explains the relationship, not a specific machine configuration.'],
    unload: ['Move to the next operation', 'Discuss how the finished part will be handled and where it needs to go next. No robot path or machine cycle is defined here.']
  },
  requirements: {
    diameter: ['Outside diameter', 'Share the outside diameter and the geometry of your part. A drawing adds context that a single dimension cannot.'],
    thickness: ['Finished thickness', 'Specify the finished distance between the two opposing faces. Leave an unknown value open for discussion.'],
    finish: ['Finish & precision', 'Flatness, parallelism and surface finish describe different requirements. Share the values on your drawing.'],
    production: ['Production needs', 'Tell us your target output, handling needs and current process. These inputs help shape the engineering conversation.']
  }
};

export function quoteHref(focus = 'machine') {
  const safeFocus = Object.hasOwn(NODES, focus) ? focus : 'machine';
  return '/request/?' + new URLSearchParams({ application: 'ring-gear', source: 'machine-explorer', equipment: EQUIPMENT, focus: safeFocus }).toString();
}
