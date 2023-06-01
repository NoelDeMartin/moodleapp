module.exports = {
    managerEntries(entry = []) {
        return [...entry, require.resolve('./manager')];
    },
    config(entry = []) {
        return [...entry, require.resolve('./preview')];
    },
};
