import bcrypt
from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False, index=True)
    permission = db.Column(db.Integer, db.ForeignKey("permissions.id"), nullable=False, index=True)

    tasks = db.relationship("Task", backref="user", cascade="all, delete-orphan", lazy=True)

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode(), self.password_hash.encode())

    def to_dict(self) -> dict:
        return {"id": self.id, "email": self.email, "role": self.role}
