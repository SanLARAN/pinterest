// Only the room host can edit these before a night. Copy, don't share a mutable settings object.
export function cleanLobbyRules(value) { return { hideNames: value?.hideNames === true }; }
