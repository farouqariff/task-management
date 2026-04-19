from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from marshmallow import ValidationError

from app.config import Config

db = SQLAlchemy()
ma = Marshmallow()
jwt = JWTManager()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)
    CORS(app)

    from app import models  # noqa: F401 — register models with SQLAlchemy

    from app.routes.auth import bp as auth_bp
    from app.routes.users import bp as users_bp
    from app.routes.projects import bp as projects_bp
    from app.routes.tasks import bp as tasks_bp
    from app.routes.notifications import bp as notifications_bp
    from app.routes.audit import bp as audit_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(audit_bp)

    @app.errorhandler(ValidationError)
    def _on_validation_error(err):
        db.session.rollback()
        return jsonify(err.messages), 400

    with app.app_context():
        db.create_all()

    return app
