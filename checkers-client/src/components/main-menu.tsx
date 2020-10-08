import React from "react";
import { Row, Col, Button } from "antd";

const MainMenu = () => {
  return (
    <div className="container">
      <div className="center">
        {/* title */}
        <Row gutter={[0, 40]}>
          <Col style={{ fontSize: 40 }}>Checker Game</Col>
        </Row>

        {/* buttons */}
        <Row gutter={[0, 10]}>
          <Col span={5}>
            <Button
              shape="round"
              style={{ width: 150, fontSize: 20 }}
              type="primary"
            >
              New Game
            </Button>
          </Col>
        </Row>
        <Row gutter={[0, 10]}>
          <Col span={5}>
            <Button
              shape="round"
              style={{ width: 150, fontSize: 20 }}
              type="primary"
            >
              Create Game
            </Button>
          </Col>
        </Row>
        <Row gutter={[0, 10]}>
          <Col span={5}>
            <Button
              shape="round"
              style={{ width: 150, fontSize: 20 }}
              type="primary"
            >
              About
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default MainMenu;
