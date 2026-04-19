from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.models import Material, Sample
from app.schemas import MaterialBase, MaterialResponse, SampleBase, SampleResponse

router = APIRouter(prefix="/api", tags=["materials"])


@router.get("/materials", response_model=List[MaterialResponse])
def list_materials(search: str = "", db: Session = Depends(get_db)):
    query = db.query(Material)
    if search:
        query = query.filter(Material.name.ilike(f"%{search}%"))
    return query.all()


@router.get("/samples", response_model=List[SampleResponse])
def list_samples(db: Session = Depends(get_db)):
    return db.query(Sample).all()


@router.get("/seed-materials")
def seed_materials(db: Session = Depends(get_db)):
    """Seed sample materials and samples."""
    if db.query(Material).count() == 0:
        materials = [
            Material(name="OncoBoost Phase III PDF", type="Brochure", description="Clinical trial results for OncoBoost"),
            Material(name="CardioMax Efficacy Study", type="Study", description="Efficacy data for CardioMax"),
            Material(name="NeuroShield Patient Guide", type="Guide", description="Patient information guide"),
            Material(name="ImmunoPlus Dosing Card", type="Card", description="Dosing guidelines"),
        ]
        db.add_all(materials)

    if db.query(Sample).count() == 0:
        samples = [
            Sample(name="OncoBoost 50mg", product="OncoBoost", quantity=100),
            Sample(name="CardioMax 25mg", product="CardioMax", quantity=200),
            Sample(name="NeuroShield 100mg", product="NeuroShield", quantity=150),
        ]
        db.add_all(samples)

    db.commit()
    return {"message": "Materials and samples seeded"}
