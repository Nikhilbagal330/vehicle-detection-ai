const AdminActivity = require(
    "../models/adminActivity.model"
);


const logActivity = async ({
    violationId,
    action,
    actor = {},
    details = {},
    note = null
}) => {

    return AdminActivity.create({
        violationId,
        action,
        performedBy: {
            userId: actor.id || null,
            name: actor.name || null,
            email: actor.email || null
        },
        details,
        note
    });
};


const getActivitiesByViolationId = async (
    violationId
) => {

    return AdminActivity
        .find({
            violationId
        })
        .sort({
            createdAt: -1
        });
};


module.exports = {
    logActivity,
    getActivitiesByViolationId
};
