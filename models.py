from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, Integer, String, func

from database import Base


class UserRole(str, Enum):
    admin = "admin"
    school_director = "school_director"
    hr_evaluator = "hr_evaluator"
    hr_head = "hr_head"
    department_head = "department_head"
    employee = "employee"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    employee_no = Column(String(50), unique=True, nullable=True)
    full_name = Column(String(150), nullable=False)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole, name="user_role"), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    must_change_password = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())