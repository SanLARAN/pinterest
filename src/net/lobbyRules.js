// Only the room host can edit these before a night. Copy, don't share a mutable settings object.
// The участок (3.0g) is not a rule to edit: it is the ground the host is standing on, and everyone plays there.
export function cleanLobbyRules(value) {
  return {
    hideNames: value?.hideNames === true,
    days: [2, 4, 6].includes(value?.days) ? value.days : 4,
    map: value?.map === 'bog' ? 'bog' : 'forest',
  };
}
