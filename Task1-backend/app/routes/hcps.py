from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.models import HCP
from app.schemas import HCPBase, HCPResponse

router = APIRouter(prefix="/api/hcps", tags=["hcps"])


@router.get("/", response_model=List[HCPResponse])
def list_hcps(search: str = "", db: Session = Depends(get_db)):
    query = db.query(HCP)
    if search:
        query = query.filter(HCP.name.ilike(f"%{search}%"))
    return query.all()


@router.post("/", response_model=HCPResponse)
def create_hcp(data: HCPBase, db: Session = Depends(get_db)):
    hcp = HCP(**data.model_dump())
    db.add(hcp)
    db.commit()
    db.refresh(hcp)
    return hcp


@router.get("/seed")
def seed_hcps(db: Session = Depends(get_db)):
    """Seed sample HCP data."""
    existing = db.query(HCP).count()
    if existing > 0:
        return {"message": f"Already have {existing} HCPs"}

    sample_hcps = [
        HCP(name="Dr. Sharma", specialty="Oncology", institution="Apollo Hospital", email="sharma@apollo.com"),
        HCP(name="Dr. Smith", specialty="Cardiology", institution="Mayo Clinic", email="smith@mayo.edu"),
        HCP(name="Dr. Patel", specialty="Neurology", institution="AIIMS", email="patel@aiims.edu"),
        HCP(name="Dr. Johnson", specialty="Oncology", institution="Johns Hopkins", email="johnson@jhu.edu"),
        HCP(name="Dr. Williams", specialty="Pulmonology", institution="Cleveland Clinic", email="williams@cc.org"),
    ]
    db.add_all(sample_hcps)
    db.commit()
    return {"message": f"Seeded {len(sample_hcps)} HCPs"}
