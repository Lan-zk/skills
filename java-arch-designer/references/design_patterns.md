# Design Patterns Reference

This document provides a summary of GoF design patterns commonly used in complex business logic scenarios.

## Behavioral Patterns

### Strategy Pattern (策略模式)
**Description:** Defines a family of algorithms, encapsulates each one, and makes them interchangeable. Strategy lets the algorithm vary independently from clients that use it.
**When to Use:**
- When many related classes differ only in their behavior.
- When you need different variants of an algorithm.
- When an algorithm uses data that clients shouldn't know about.
- When a class defines many behaviors, and these appear as multiple conditional statements in its operations.
**Structure:**
- `Strategy` Interface
- `ConcreteStrategy` Implementation(s)
- `Context` (holds a reference to a Strategy)

### State Pattern (状态模式)
**Description:** Allows an object to alter its behavior when its internal state changes. The object will appear to change its class.
**When to Use:**
- When an object's behavior depends on its state, and it must change its behavior at run-time depending on that state.
- When operations have large, multipart conditional statements that depend on the object's state.
**Structure:**
- `State` Interface
- `ConcreteState` Implementation(s)
- `Context` (defines the interface of interest to clients)

### Chain of Responsibility (责任链模式)
**Description:** Avoids coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along the chain until an object handles it.
**When to Use:**
- When more than one object may handle a request, and the handler isn't known a priori.
- When you want to issue a request to one of several objects without specifying the receiver explicitly.
- When the set of objects that can handle a request should be specified dynamically.
**Structure:**
- `Handler` Interface (defines interface for handling requests)
- `ConcreteHandler` Implementation(s) (handles request or forwards to successor)
- `Client` (initiates the request)

### Observer Pattern (观察者模式)
**Description:** Defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.
**When to Use:**
- When an abstraction has two aspects, one dependent on the other.
- When a change to one object requires changing others, and you don't know how many objects need to be changed.
- When an object should be able to notify other objects without making assumptions about who these objects are.
**Structure:**
- `Subject` (attaches and detaches observers)
- `Observer` (defines an updating interface)
- `ConcreteSubject` (stores state of interest to ConcreteObserver)
- `ConcreteObserver` (maintains a reference to a ConcreteSubject object)

### Template Method Pattern (模板方法模式)
**Description:** Defines the skeleton of an algorithm in an operation, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps of an algorithm without changing the algorithm's structure.
**When to Use:**
- To implement the invariant parts of an algorithm once and leave it up to subclasses to implement the behavior that can vary.
- When common behavior among subclasses should be factored and localized in a common class to avoid code duplication.
**Structure:**
- `AbstractClass` (defines abstract primitive operations)
- `ConcreteClass` (implements the primitive operations)

## Creational Patterns

### Factory Method (工厂方法模式)
**Description:** Defines an interface for creating an object, but lets subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.
**When to Use:**
- When a class can't anticipate the class of objects it must create.
- When a class wants its subclasses to specify the objects it creates.
**Structure:**
- `Product` Interface
- `ConcreteProduct` Implementation(s)
- `Creator` (declares the factory method)
- `ConcreteCreator` (overrides the factory method to return an instance of a ConcreteProduct)

### Abstract Factory (抽象工厂模式)
**Description:** Provides an interface for creating families of related or dependent objects without specifying their concrete classes.
**When to Use:**
- When a system should be independent of how its products are created, composed, and represented.
- When a system should be configured with one of multiple families of products.
**Structure:**
- `AbstractFactory` Interface
- `ConcreteFactory` Implementation(s)
- `AbstractProduct` Interface
- `ConcreteProduct` Implementation(s)

## Structural Patterns

### Adapter Pattern (适配器模式)
**Description:** Converts the interface of a class into another interface clients expect. Adapter lets classes work together that couldn't otherwise because of incompatible interfaces.
**When to Use:**
- When you want to use an existing class, and its interface does not match the one you need.
- When you want to create a reusable class that cooperates with unrelated or unforeseen classes.
**Structure:**
- `Target` Interface
- `Adapter` Implementation (adapts the interface of Adaptee to the Target interface)
- `Adaptee` (defines an existing interface that needs adapting)

### Decorator Pattern (装饰者模式)
**Description:** Attaches additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.
**When to Use:**
- To add responsibilities to individual objects dynamically and transparently, that is, without affecting other objects.
- For responsibilities that can be withdrawn.
- When extension by subclassing is impractical.
**Structure:**
- `Component` Interface
- `ConcreteComponent` Implementation(s)
- `Decorator` (maintains a reference to a Component object)
- `ConcreteDecorator` Implementation(s) (adds responsibilities to the component)

### Facade Pattern (外观模式)
**Description:** Provides a unified interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use.
**When to Use:**
- When you want to provide a simple interface to a complex subsystem.
- When there are many dependencies between clients and the implementation classes of an abstraction.
**Structure:**
- `Facade` (knows which subsystem classes are responsible for a request)
- `Subsystem classes` (implement subsystem functionality)

## Other Patterns

### Command Pattern (命令模式)
**Description:** Encapsulates a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations.
**When to Use:**
- When you want to parameterize objects by an action to perform.
- When you want to specify, queue, and execute requests at different times.
- When you want to support undo.
**Structure:**
- `Command` Interface
- `ConcreteCommand` Implementation(s)
- `Invoker` (asks the command to carry out the request)
- `Receiver` (knows how to perform the operations associated with carrying out a request)
