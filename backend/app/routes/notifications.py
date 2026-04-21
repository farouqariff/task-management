from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.notification import Notification
from app.schemas.notification_schema import NotificationSchema
from app.utils.auth import current_user

bp = Blueprint("notifications", __name__, url_prefix="/notifications")

notifications_schema = NotificationSchema(many=True)
notification_schema = NotificationSchema()


@bp.get("")
@jwt_required()
def list_notifications():
    me_ = current_user()
    if not me_:
        return jsonify({"error": "user not found"}), 404
    items = (
        Notification.query
        .filter_by(user_id=me_.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify(notifications_schema.dump(items)), 200


@bp.put("/<int:notification_id>/read")
@jwt_required()
def mark_read(notification_id):
    me_ = current_user()
    n = Notification.query.get(notification_id)
    if not n:
        return jsonify({"error": "notification not found"}), 404
    if n.user_id != me_.id:
        return jsonify({"error": "forbidden"}), 403

    n.mark_read()
    db.session.commit()
    return jsonify(notification_schema.dump(n)), 200


@bp.delete("/<int:notification_id>")
@jwt_required()
def delete_notification(notification_id):
    me_ = current_user()
    n = Notification.query.get(notification_id)
    if not n:
        return jsonify({"error": "notification not found"}), 404
    if n.user_id != me_.id:
        return jsonify({"error": "forbidden"}), 403

    db.session.delete(n)
    db.session.commit()
    return jsonify({"msg": "notification deleted", "id": notification_id}), 200
