# all the database model

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, create_engine, MetaData, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship

Base = declarative_base()


class  User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    rank = relationship("Rank")

    def __repr__(self):
        return "<User(name='%s')>" % self.name


class Question(Base):
    __tablename__ = 'question'
    id = Column(Integer, primary_key=True)
    number = Column(Integer)
    score = Column(Integer)
    answer = Column(String)


class Rank(Base):
    __tablename__ = 'rank'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    score = Column(Integer)

    user = relationship("User", back_populates="rank")



DBSession = sessionmaker()



if __name__ == "__main__":
    #engine = create_engine("'sqlite:////home/shaoliming/foo.db")
    engine = create_engine("sqlite:////home/shaoliming/foo.db")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    # Base.metadata.create_all(engine)
    session.add(User( name="username"))
    session.add(Question(number=4, score=5, answer="00000011111111"))
    session.add(Question(number=5, score=5, answer="000000111111110"))
    session.add(Rank(user_id=0, score=0))
    session.commit()
