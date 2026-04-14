import os

from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from auth import authenticate_user, create_access_token, get_current_user, require_roles
from database import Base, engine, get_db
from models import User, UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_no: str | None = None
    full_name: str
    username: str
    email: str
    role: UserRole
    is_active: bool
    must_change_password: bool


app = FastAPI(title="HRERS User Accounts")

base_dir = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(base_dir / "templates"))
app.mount("/static", StaticFiles(directory=str(base_dir / "static")), name="static")

cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in cors_origins else cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def root() -> RedirectResponse:
    return RedirectResponse(url="/login", status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login/login.html", {"request": request})


@app.get("/forgot-password", response_class=HTMLResponse)
def forgot_password_page(request: Request):
    return templates.TemplateResponse("login/forpass.html", {"request": request})


@app.get("/change-password", response_class=HTMLResponse)
def change_password_page(request: Request):
    return templates.TemplateResponse("login/changepass.html", {"request": request})


@app.get("/dashboard/admin", response_class=HTMLResponse)
def admin_dashboard_page(request: Request):
    return templates.TemplateResponse("admin/dashboard.html", {"request": request})


@app.get("/dashboard/school-director", response_class=HTMLResponse)
def school_director_dashboard_page(request: Request):
    return templates.TemplateResponse("sd/sd_dash.html", {"request": request})


@app.get("/dashboard/hr", response_class=HTMLResponse)
def hr_dashboard_page(request: Request):
    return templates.TemplateResponse("hr/hr_dash.html", {"request": request})


@app.get("/dashboard/department-head", response_class=HTMLResponse)
def department_head_dashboard_page(request: Request):
    return templates.TemplateResponse("head/head_dash.html", {"request": request})


@app.get("/dashboard/employee", response_class=HTMLResponse)
def employee_dashboard_page(request: Request):
    return templates.TemplateResponse("employee/emp_dash.html", {"request": request})


@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = str(user.username)
    role = str(user.role.value)
    token = create_access_token(subject=username, role=role)
    return {"access_token": token, "token_type": "bearer", "role": role}


@app.get("/auth/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/roles")
def list_roles() -> list[str]:
    return [role.value for role in UserRole]


@app.get("/admin-only")
def admin_only(current_user: User = Depends(require_roles(UserRole.admin))):
    return {"message": f"Welcome, {current_user.full_name}."}