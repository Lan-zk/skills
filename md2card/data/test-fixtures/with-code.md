# 代码块测试文档

本文档用于测试各种代码块场景。

## 短代码块

```javascript
console.log('Hello');
```

## 中等代码块

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): User | null {
  return {
    id,
    name: 'John Doe',
    email: 'john@example.com'
  };
}
```

## 长代码块（需要跨页）

```python
"""
这是一个非常长的 Python 代码文件
用于测试代码块跨页拆分功能
"""

import os
import sys
import json
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Config:
    """应用程序配置"""
    app_name: str = "MyApp"
    version: str = "1.0.0"
    debug: bool = False
    log_level: str = "INFO"
    max_connections: int = 100
    timeout: int = 30
    retry_count: int = 3
    cache_enabled: bool = True
    cache_ttl: int = 3600
    database_url: str = ""
    redis_url: str = ""
    s3_bucket: str = ""
    aws_access_key: str = ""
    aws_secret_key: str = ""

class Application:
    """主应用程序类"""

    def __init__(self, config: Config):
        self.config = config
        self.started_at = datetime.now()
        self.requests_count = 0
        self.errors_count = 0
        self.users: Dict[int, Dict[str, Any]] = {}

    def start(self) -> None:
        """启动应用程序"""
        print(f"Starting {self.config.app_name} v{self.config.version}")
        print(f"Debug mode: {self.config.debug}")
        print(f"Log level: {self.config.log_level}")
        print(f"Max connections: {self.config.max_connections}")
        print(f"Timeout: {self.config.timeout}s")
        print(f"Retry count: {self.config.retry_count}")
        print(f"Cache: {self.config.cache_enabled} (TTL: {self.config.cache_ttl}s)")

    def handle_request(self, request_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """处理请求"""
        self.requests_count += 1
        try:
            result = self.process_data(data)
            return {
                "success": True,
                "request_id": request_id,
                "data": result,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            self.errors_count += 1
            return {
                "success": False,
                "request_id": request_id,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def process_data(self, data: Dict[str, Any]) -> Any:
        """处理数据"""
        if not data:
            raise ValueError("Data is empty")

        action = data.get("action", "")
        if action == "get_user":
            return self.get_user(data.get("user_id"))
        elif action == "create_user":
            return self.create_user(data)
        elif action == "update_user":
            return self.update_user(data)
        elif action == "delete_user":
            return self.delete_user(data.get("user_id"))
        else:
            raise ValueError(f"Unknown action: {action}")

    def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        """获取用户"""
        return self.users.get(user_id)

    def create_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """创建用户"""
        user_id = len(self.users) + 1
        user = {
            "id": user_id,
            "name": data.get("name", ""),
            "email": data.get("email", ""),
            "created_at": datetime.now().isoformat()
        }
        self.users[user_id] = user
        return user

    def update_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """更新用户"""
        user_id = data.get("user_id")
        if user_id not in self.users:
            raise ValueError(f"User not found: {user_id}")

        user = self.users[user_id]
        if "name" in data:
            user["name"] = data["name"]
        if "email" in data:
            user["email"] = data["email"]
        user["updated_at"] = datetime.now().isoformat()
        return user

    def delete_user(self, user_id: int) -> bool:
        """删除用户"""
        if user_id in self.users:
            del self.users[user_id]
            return True
        return False

    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        return {
            "started_at": self.started_at.isoformat(),
            "uptime_seconds": (datetime.now() - self.started_at).total_seconds(),
            "requests_count": self.requests_count,
            "errors_count": self.errors_count,
            "users_count": len(self.users),
            "error_rate": self.errors_count / max(1, self.requests_count)
        }

def main():
    """主函数"""
    config = Config(
        app_name="TestApp",
        debug=True,
        log_level="DEBUG"
    )

    app = Application(config)
    app.start()

    # 模拟请求
    result = app.handle_request(1, {
        "action": "create_user",
        "name": "John Doe",
        "email": "john@example.com"
    })
    print(f"Result: {json.dumps(result, indent=2)}")

    stats = app.get_stats()
    print(f"Stats: {json.dumps(stats, indent=2)}")

if __name__ == "__main__":
    main()
```

## 多语言代码块

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
```

```css
body {
  font-family: sans-serif;
  margin: 0;
  padding: 20px;
}

h1 {
  color: #333;
}
```

```bash
#!/bin/bash
echo "Hello World"
ls -la
```

## 纯文本（无语言）

```
这是一段纯文本代码块
没有语法高亮
保持原始格式
```

---

文档结束。
